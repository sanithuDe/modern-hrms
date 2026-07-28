import {
  gemini,
  geminiModel,
} from "../config/gemini.js";

async function testGemini(): Promise<void> {
  try {
    console.log(
      `Testing Gemini model: ${geminiModel}`,
    );

    const response =
      await gemini.models.generateContent({
        model: geminiModel,

        contents: [
          {
            role: "user",

            parts: [
              {
                text:
                  "Reply with exactly: Gemini connection successful",
              },
            ],
          },
        ],
      });

    const responseText =
      response.text?.trim();

    if (!responseText) {
      throw new Error(
        "Gemini returned an empty response",
      );
    }

    console.log(responseText);
  } catch (error) {
    console.error(
      "Gemini connection failed:",
      error,
    );

    process.exitCode = 1;
  }
}

void testGemini();