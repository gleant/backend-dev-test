import fs from "fs";
import path from "path";
import R from "ramda";

type AnswerOption = {
  answer: string;
  nextState: string;
};

type QuestionsType = {
  [id: string]: {
    id: string;
    question: string;
    answerOptions: AnswerOption[];
  };
};

/**
 * Conversation chat bot which asks questions from user based on user's answer.
 */
export default class ConversationChatBot {
  private questions: QuestionsType;
  private startQuestionId: string;
  private currentQuestionId: string;

  /**
   * Creates a new instance of ConversationChatBot and loads questions from a file given as a parameter.
   * The file encoding must be UTF-8 and contains a list of questions in JSON format.
   * @param filePath Relative path from process root to file from where to load questions.
   */
  constructor(filePath: string) {
    const questions = this.loadFile(filePath);

    this.validateQuestions(questions);
    this.startQuestionId = questions[0].id;
    this.currentQuestionId = this.startQuestionId;
    this.questions = this.indexQuestions(questions);
  }

  /**
   * Asks questions from user based on answer.
   * Conversation start with empty string when there is no previous questions asked.
   * @param answer Answer to previous question.
   */
  reply(answer: string): string {
    const cleanedAnswer = answer.trim();
    if (!cleanedAnswer) {
      return this.questions[this.currentQuestionId].question;
    }
    return "";
  }

  /**
   * Loads file content from a given path and parses content to JSON.
   * @param filePath Relative path from process root to file from where to load questions.
   */
  private loadFile(filePath: string): any {
    try {
      const fileContent = fs.readFileSync(path.join(process.cwd(), filePath), {
        encoding: "utf-8",
      });
      return JSON.parse(fileContent);
    } catch (err) {
      throw new Error(
        `Failed to load file from ${filePath}. Please, check that file exist and is json format.`,
      );
    }
  }

  /**
   * Parses a list of questions to object which key is questions' id.
   * @param questions A list of questions to be indexed.
   */
  private indexQuestions(questions: any): QuestionsType {
    return R.indexBy(R.prop("id"), questions);
  }

  /**
   * Verifies that questions param is in the required format or throws an error.
   * @param questions
   */
  private validateQuestions(questions: any): void {
    if (!Array.isArray(questions)) {
      throw new Error("File must include array of questions.");
    }

    questions.forEach(question => {
      if (!(question.id && question.question)) {
        throw new Error("All questions must have id and question.");
      }

      this.validateQuestionAnswerOptions(question.answerOptions);
    });
  }

  /**
   * Verifies that answerOptions param is in the required format or throws an error.
   *
   * Validates that answerOptions is array and has object with keys answer and nextState.
   * Throws error if any check fails.
   * @param answerOptions
   */
  private validateQuestionAnswerOptions(answerOptions: any): void {
    if (!answerOptions) {
      return;
    }

    if (!Array.isArray(answerOptions)) {
      throw new Error("question.answerOptions must be an array.");
    }

    answerOptions.forEach(answerOption => {
      if (!(answerOption.answer && answerOption.nextState)) {
        throw new Error(
          "question.answerOption must have answer and nextState.",
        );
      }
    });
  }
}
