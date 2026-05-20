import { useConfigureSuggestions } from "@copilotkit/react-core/v2";
import showcaseConfig from "../showcase.json";

const showcase = showcaseConfig.showcase;

export const useSuggestions = () => {
  useConfigureSuggestions({
    suggestions: [
      {
        title: "Sprint Progress",
        message: "What is the latest sprint progress?",
      },
    ],
    available: "always",
  });
};
