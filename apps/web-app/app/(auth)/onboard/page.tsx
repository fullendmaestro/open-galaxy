"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, UploadCloudIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function OnboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("researcher");

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError("");
    }
  };

  const handleCompleteSetup = async () => {
    if (!username || !fullName || !email) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      let avatarUrl = "";

      if (file) {
        const uploadRes = await fetch(`/api/upload?filename=${file.name}`, {
          method: "POST",
          body: file,
        });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const blob = await uploadRes.json();
        avatarUrl = blob.url;
      }

      const onboardRes = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar: avatarUrl,
          username: username.toLowerCase().trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          role,
        }),
      });

      if (!onboardRes.ok) {
        const data = await onboardRes.json();
        throw new Error(data.error || "Failed to save profile");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Create your profile</CardTitle>
          <CardDescription>
            Configure your Open Galaxy identity and platform role.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Section 1: Identity */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Avatar
            </h3>
            <div className="flex items-center gap-6">
              <div
                className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted overflow-hidden hover:bg-muted/80 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <UploadCloudIcon className="h-6 w-6 text-muted-foreground" />
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Click to upload a profile picture.</p>
                <p>JPG, PNG or WebP. Max size of 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  placeholder="e.g. Afolabi Abdulsamad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. afolabi_xyz"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Platform Role */}
          <div className="space-y-4">
            <Label className="text-base">Primary Platform Role</Label>
            <RadioGroup
              value={role}
              onValueChange={setRole}
              className="grid grid-cols-1 items-start gap-4 md:grid-cols-2"
            >
              <Label
                htmlFor="role-researcher"
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 transition-colors"
              >
                <RadioGroupItem
                  value="researcher"
                  id="role-researcher"
                  className="mt-0.5"
                />
                <div className="grid gap-1">
                  <span className="font-semibold text-sm leading-none">
                    Researcher
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    Access academic libraries, contribute to datasets, and
                    participate in active sprints.
                  </span>
                </div>
              </Label>

              <Label
                htmlFor="role-publisher"
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 transition-colors"
              >
                <RadioGroupItem
                  value="publisher"
                  id="role-publisher"
                  className="mt-0.5"
                />
                <div className="grid gap-1">
                  <span className="font-semibold text-sm leading-none">
                    Publisher
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    Publish research papers, manage peer reviews, and oversee
                    decentralized liquidity models.
                  </span>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleCompleteSetup}
            disabled={isUploading || !username || !fullName || !email}
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "Setting up workspace..." : "Complete Setup"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
