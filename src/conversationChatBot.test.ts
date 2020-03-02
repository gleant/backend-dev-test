import Conversation from "./conversationChatBot";

const errorQuestion = "Sorry, I did't understand. Please, try again.";
const getCofirmationQuestion = (answer: string): string =>
  `Did you mean '${answer}'?`;

describe("Conversation Chat Bot", () => {
  let troubleshootingChatBot: Conversation;

  describe("initialze", () => {
    it("should throw error when given file not found", () => {
      try {
        new Conversation("./src/data/missing.json");
        throw new Error("It should fail!");
      } catch (err) {
        expect(err.message).toEqual(
          "Failed to load file from ./src/data/missing.json. Please, check that file exist and is json format.",
        );
      }
    });

    it("should throw error when given file contains invalid json", () => {
      try {
        new Conversation("./src/data/troubleshootingInvalidJson.json");
        throw new Error("It should fail!");
      } catch (err) {
        expect(err.message).toEqual(
          "Failed to load file from ./src/data/troubleshootingInvalidJson.json. Please, check that file exist and is json format.",
        );
      }
    });

    it("should throw error when given file does not contain array of questions", () => {
      try {
        new Conversation("./src/data/troubleshootingObject.json");
        throw new Error("It should fail!");
      } catch (err) {
        expect(err.message).toEqual("File must include array of questions.");
      }
    });

    it("should throw error when questions in given file do not have correct structure", () => {
      try {
        new Conversation("./src/data/troubleshootingInvalidQuestion.json");
        throw new Error("It should fail!");
      } catch (err) {
        expect(err.message).toEqual("All questions must have id and question.");
      }
    });

    it("should throw error when questions' answerOptions in given file is object", () => {
      try {
        new Conversation("./src/data/troubleshootingAnswerOptionObject.json");
        throw new Error("It should fail!");
      } catch (err) {
        expect(err.message).toEqual("question.answerOptions must be an array.");
      }
    });

    it("should throw error when questions' answerOptions in given file do not have correct structure", () => {
      try {
        new Conversation("./src/data/troubleshootingInvalidAnswerOption.json");
        throw new Error("It should fail!");
      } catch (err) {
        expect(err.message).toEqual(
          "question.answerOption must have answer and nextState.",
        );
      }
    });

    it("should not throw error when given file exist and is well structured", () => {
      try {
        new Conversation("./src/data/troubleshooting.json");
      } catch (err) {
        throw new Error("It should not fail!");
      }
    });
  });

  describe("reply", () => {
    beforeEach(() => {
      troubleshootingChatBot = new Conversation(
        "./src/data/troubleshooting.json",
      );
    });

    it("should return first question when called with empty string", () => {
      const res = troubleshootingChatBot.reply("");
      expect(res).toEqual("What kind of problem are you facing?");
    });

    it("should return error question when called without empty string on starting conversation", () => {
      const res = troubleshootingChatBot.reply("My internet doesn't work");
      expect(res).toEqual(errorQuestion);
    });

    it("should return error question when answer do not match any answer option and cannot be guessed", () => {
      troubleshootingChatBot.reply("");
      const res = troubleshootingChatBot.reply("My laptop doesn't work");
      expect(res).toEqual(errorQuestion);
    });

    it("should return error question when answer matches partially to multiple answer option", () => {
      troubleshootingChatBot.reply("");
      troubleshootingChatBot.reply("My internet doesn't work");
      const res = troubleshootingChatBot.reply("Yes, but no help");
      expect(res).toEqual(errorQuestion);
    });

    it("should return confirmation question when answer matches partially to only one answer option", () => {
      troubleshootingChatBot.reply("");
      troubleshootingChatBot.reply("My phone doesn't work");
      const res = troubleshootingChatBot.reply(
        "My phone is Samsung Galaxy S10",
      );
      expect(res).toEqual(getCofirmationQuestion("Samsung Galaxy S10"));
    });

    it("should return next question if answer yes to confirmation question", () => {
      troubleshootingChatBot.reply("");
      troubleshootingChatBot.reply("My phone doesn't work");
      troubleshootingChatBot.reply("My phone is Samsung Galaxy S10");
      const res = troubleshootingChatBot.reply("Yes");
      expect(res).toEqual("Contact Samsung service?");
    });

    it("should return previous question if answer no to confirmation question", () => {
      troubleshootingChatBot.reply("");
      troubleshootingChatBot.reply("My phone doesn't work");
      troubleshootingChatBot.reply("My phone is Samsung Galaxy S10");
      const res = troubleshootingChatBot.reply("No");
      expect(res).toEqual("What is the make and model of your phone?");
    });

    it("should return next question although case size differs in answer and answer option", () => {
      troubleshootingChatBot.reply("");
      const res = troubleshootingChatBot.reply("my internet doesn't work");
      expect(res).toEqual("Have you tried resetting your router?");
    });

    it("should try to guess only once and return error if answer to confirm question is not exact answer", () => {
      troubleshootingChatBot.reply("");
      troubleshootingChatBot.reply("My phone doesn't work");
      troubleshootingChatBot.reply("My phone is Samsung Galaxy S10");
      const res = troubleshootingChatBot.reply("Yes, that's my phone");
      expect(res).toEqual(errorQuestion);
    });

    it("should go through conversation 1", () => {
      troubleshootingChatBot.reply("");
      const res1 = troubleshootingChatBot.reply("My internet doesn't work");
      expect(res1).toEqual("Have you tried resetting your router?");
      const res2 = troubleshootingChatBot.reply("Yes");
      expect(res2).toEqual("Have you tried with another cable?");
      const res3 = troubleshootingChatBot.reply("Yes");
      expect(res3).toEqual("Contact our customer support for more help.");
    });

    it("should go through conversation 2", () => {
      troubleshootingChatBot.reply("");
      const res1 = troubleshootingChatBot.reply("My phone doesn't work");
      expect(res1).toEqual("What is the make and model of your phone?");
      const res2 = troubleshootingChatBot.reply("iPhone X");
      expect(res2).toEqual("Contact Apple service?");
    });

    it("should go through conversation with confirmation question", () => {
      troubleshootingChatBot.reply("");
      const res1 = troubleshootingChatBot.reply(
        "My internet doesn't work at my home",
      );
      expect(res1).toEqual(getCofirmationQuestion("My internet doesn't work"));
      const res2 = troubleshootingChatBot.reply("Yes");
      expect(res2).toEqual("Have you tried resetting your router?");
      const res3 = troubleshootingChatBot.reply("No");
      expect(res3).toEqual("Please try resetting the router?");
    });

    it("should go through conversation with multiple confirmation question", () => {
      troubleshootingChatBot.reply("");
      const res1 = troubleshootingChatBot.reply(
        "My internet doesn't work at my home",
      );
      expect(res1).toEqual(getCofirmationQuestion("My internet doesn't work"));
      const res2 = troubleshootingChatBot.reply("Yes");
      expect(res2).toEqual("Have you tried resetting your router?");
      const res3 = troubleshootingChatBot.reply("No, I haven't");
      expect(res3).toEqual(getCofirmationQuestion("No"));
      const res4 = troubleshootingChatBot.reply("Yes");
      expect(res4).toEqual("Please try resetting the router?");
    });

    it("should start new conversation when previous conversation finished and called with empty string", () => {
      troubleshootingChatBot.reply("");
      troubleshootingChatBot.reply("My phone doesn't work");
      troubleshootingChatBot.reply("iPhone X");
      const res = troubleshootingChatBot.reply("");
      expect(res).toEqual("What kind of problem are you facing?");
    });
  });
});
