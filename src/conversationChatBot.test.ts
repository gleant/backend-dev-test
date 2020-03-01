import Conversation from "./conversationChatBot";
import troubleshooting from "./data/troubleshooting.json";

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
      expect(res).toEqual(troubleshooting[0].question);
    });
  });
});
