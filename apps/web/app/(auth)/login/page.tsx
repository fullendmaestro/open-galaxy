"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useWallets,
  useConnectWallet,
  useCurrentAccount,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { isEnokiWallet } from "@mysten/enoki";
import { Transaction } from "@mysten/sui/transactions";
import { Loader2, GalleryVerticalEndIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldDescription } from "@/components/ui/field";
import { enokiConfig } from "@/lib/enoki/config";

// --- Types & Constants ---
type Step =
  | "idle"
  | "connecting"
  | "generating-key"
  | "registering-onchain"
  | "creating-session"
  | "done";

const STEP_LABELS: Record<Step, string> = {
  idle: "",
  connecting: "Signing in with Google...",
  "generating-key": "Generating delegate key...",
  "registering-onchain": "Registering on-chain...",
  "creating-session": "Creating session...",
  done: "Redirecting...",
};

// --- Helper Functions ---
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Execute a transaction via Enoki gas sponsorship through the MemWal relayer.
 */
async function sponsoredSignAndExecute(
  transaction: Transaction,
  sender: string,
  suiClient: ReturnType<typeof useSuiClient>,
  signTransaction: (args: {
    transaction: Transaction;
  }) => Promise<{ signature: string }>,
): Promise<{ digest: string }> {
  const kindBytes = await transaction.build({
    client: suiClient as any,
    onlyTransactionKind: true,
  });

  const sponsorRes = await fetch(`${enokiConfig.memwalServerUrl}/sponsor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactionBlockKindBytes: uint8ArrayToBase64(kindBytes),
      sender,
    }),
  });

  if (!sponsorRes.ok) {
    const errText = await sponsorRes.text();
    throw new Error(`Sponsor failed (${sponsorRes.status}): ${errText}`);
  }

  const sponsored = await sponsorRes.json();
  const sponsoredTx = Transaction.from(sponsored.bytes);
  const { signature } = await signTransaction({ transaction: sponsoredTx });

  const execRes = await fetch(
    `${enokiConfig.memwalServerUrl}/sponsor/execute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ digest: sponsored.digest, signature }),
    },
  );

  if (!execRes.ok) {
    const errText = await execRes.text();
    throw new Error(`Sponsored execute failed (${execRes.status}): ${errText}`);
  }

  return execRes.json();
}

// --- Main Component ---
export default function LoginPage() {
  const router = useRouter();
  const wallets = useWallets();
  const { mutateAsync: connect } = useConnectWallet();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const setupRunningRef = useRef(false);

  const enokiWallets = wallets.filter(isEnokiWallet);
  const googleWallet = enokiWallets.find((w) => w.provider === "google");
  const hasEnokiConfig =
    enokiConfig.enokiApiKey &&
    enokiConfig.googleClientId &&
    enokiConfig.memwalPackageId &&
    enokiConfig.memwalRegistryId &&
    enokiConfig.memwalServerUrl;

  const [pendingSetup, setPendingSetup] = useState(false);

  const runSetup = useCallback(
    async (address: string) => {
      if (setupRunningRef.current) return;
      setupRunningRef.current = true;

      try {
        setStep("creating-session");
        const checkRes = await fetch("/api/auth/enoki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ suiAddress: address }),
        });

        if (!checkRes.ok) {
          throw new Error("Unable to check account status. Please try again.");
        }

        const checkData = await checkRes.json();
        if (!checkData.needsSetup) {
          setStep("done");
          router.push("/");
          router.refresh();
          return;
        }

        setStep("generating-key");
        const ed = await import("@noble/ed25519");
        const { blake2b } = await import("@noble/hashes/blake2b");

        const privateKeyRaw = new Uint8Array(32);
        crypto.getRandomValues(privateKeyRaw);
        const publicKeyRaw = await ed.getPublicKeyAsync(privateKeyRaw);

        const privateKeyHex = bytesToHex(privateKeyRaw);
        const publicKeyHex = bytesToHex(publicKeyRaw);

        const addrInput = new Uint8Array(33);
        addrInput[0] = 0x00;
        addrInput.set(publicKeyRaw, 1);
        const addressBytes = blake2b(addrInput, { dkLen: 32 });
        const delegateSuiAddress =
          "0x" + bytesToHex(new Uint8Array(addressBytes));

        setStep("registering-onchain");

        let knownAccountId: string | null = null;

        try {
          const registryObj = await suiClient.getObject({
            id: enokiConfig.memwalRegistryId,
            options: { showContent: true },
          });
          if (
            registryObj?.data?.content &&
            "fields" in registryObj.data.content
          ) {
            const fields = registryObj.data.content.fields as any;
            const tableId = fields?.accounts?.fields?.id?.id;
            if (tableId) {
              const dynField = await suiClient.getDynamicFieldObject({
                parentId: tableId,
                name: { type: "address", value: address },
              });
              if (
                dynField?.data?.content &&
                "fields" in dynField.data.content
              ) {
                knownAccountId = (dynField.data.content.fields as any)
                  .value as string;
              }
            }
          }
        } catch {
          // Dynamic field not found → no account yet
        }

        const pubKeyBytes = Array.from(publicKeyRaw);
        const sign = (args: { transaction: Transaction }) =>
          signTransaction(args);

        if (knownAccountId) {
          const tx = new Transaction();
          tx.moveCall({
            target: `${enokiConfig.memwalPackageId}::account::add_delegate_key`,
            arguments: [
              tx.object(knownAccountId),
              tx.pure("vector<u8>", pubKeyBytes),
              tx.pure("address", delegateSuiAddress),
              tx.pure("string", "Researcher"),
              tx.object("0x6"),
            ],
          });
          const result = await sponsoredSignAndExecute(
            tx,
            address,
            suiClient,
            sign,
          );
          await suiClient.waitForTransaction({ digest: result.digest });
        } else {
          const tx = new Transaction();
          tx.moveCall({
            target: `${enokiConfig.memwalPackageId}::account::create_account`,
            arguments: [
              tx.object(enokiConfig.memwalRegistryId),
              tx.object("0x6"),
            ],
          });
          const createResult = await sponsoredSignAndExecute(
            tx,
            address,
            suiClient,
            sign,
          );
          await suiClient.waitForTransaction({
            digest: createResult.digest,
          });

          const txDetails = await suiClient.getTransactionBlock({
            digest: createResult.digest,
            options: { showObjectChanges: true },
          });
          const createdObj = txDetails.objectChanges?.find(
            (c) =>
              c.type === "created" &&
              "objectType" in c &&
              c.objectType.includes("MemWalAccount"),
          );
          if (createdObj && "objectId" in createdObj) {
            knownAccountId = createdObj.objectId;
          }

          if (!knownAccountId) {
            throw new Error(
              "Account created on-chain but object ID not found in transaction. Please try again.",
            );
          }

          const tx2 = new Transaction();
          tx2.moveCall({
            target: `${enokiConfig.memwalPackageId}::account::add_delegate_key`,
            arguments: [
              tx2.object(knownAccountId!),
              tx2.pure("vector<u8>", pubKeyBytes),
              tx2.pure("address", delegateSuiAddress),
              tx2.pure("string", "Researcher"),
              tx2.object("0x6"),
            ],
          });
          const addResult = await sponsoredSignAndExecute(
            tx2,
            address,
            suiClient,
            sign,
          );
          await suiClient.waitForTransaction({ digest: addResult.digest });
        }

        setStep("creating-session");
        const res = await fetch("/api/auth/enoki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suiAddress: address,
            privateKey: privateKeyHex,
            accountId: knownAccountId!,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Session creation failed");
        }

        setStep("done");
        router.push("/");
        router.refresh();
      } catch (err) {
        console.error("[enoki-login] Setup failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Setup failed. Please try again.",
        );
        setStep("idle");
      } finally {
        setupRunningRef.current = false;
      }
    },
    [suiClient, signTransaction, router],
  );

  useEffect(() => {
    if (pendingSetup && currentAccount?.address) {
      setPendingSetup(false);
      runSetup(currentAccount.address);
    }
  }, [pendingSetup, currentAccount?.address, runSetup]);

  const handleGoogleSignIn = async () => {
    if (!googleWallet) return;

    setError("");
    setStep("connecting");

    try {
      await connect({ wallet: googleWallet });
      setPendingSetup(true);
    } catch (err) {
      console.error("[enoki-login] Connect failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in failed. Please try again.",
      );
      setStep("idle");
    }
  };

  const isProcessing = step !== "idle";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Acme Inc.
        </a>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>Login with your Google account</CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <FieldGroup>
                  <Field>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={
                        isProcessing || !hasEnokiConfig || !googleWallet
                      }
                      onClick={handleGoogleSignIn}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          {STEP_LABELS[step]}
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="mr-2 size-4"
                          >
                            <path
                              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                              fill="currentColor"
                            />
                          </svg>
                          Login with Google
                        </>
                      )}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>

              {error && (
                <div className="mt-4 text-center text-sm font-medium text-destructive">
                  {error}
                </div>
              )}
              {(!hasEnokiConfig || !googleWallet) && (
                <div className="mt-4 text-center text-sm font-medium text-muted-foreground">
                  Authentication is currently unavailable.
                </div>
              )}
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
