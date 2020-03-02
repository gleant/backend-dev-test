import fs from "fs";
import path from "path";
import R from "ramda";

type AnswerOption = {
  answer: string;
  nextState: string;
};

type QuestionType = {
  id: string;
  question: string;
  answerOptions?: AnswerOption[];
};

type QuestionsType = {
  [id: string]: QuestionType;
};

/**
 * Conversation chat bot which asks questions from user based on user's answer.
 */
export default class ConversationChatBot {
  private questions: QuestionsType;
  private startQuestionId: string;
  private currentQuestion: QuestionType | undefined;

  /**
   * Creates a new instance of ConversationChatBot and loads questions from a file given as a parameter.
   * The file encoding must be UTF-8 and contains a list of questions in JSON format.
   *
   * Question structure:
   * {
   *   id: string;
   *   question: string;
   *   answerOptions: {
   *     answer: string;
   *     nextState: string;
   *   }
   * }
   *
   * @param filePath Relative path from process root to file from where to load questions.
   */
  constructor(filePath: string) {
    const questions = this.loadFile(filePath);

    this.validateQuestions(questions);
    this.startQuestionId = questions[0].id;
    this.questions = this.indexQuestions(questions);
    this.currentQuestion = undefined;
  }

  /**
   * Returns next question based on answer.
   *
   * Returns conversation start question when there is not previous question and answer is empty.
   * When there is previous question returns next question if can be found or returns confirmation question when
   * answer partially matches one of previous question's answerOptions.
   * Otherwise, returns error question.
   *
   * @param answer Answer to previous question or empty string if there is no previous question.
   */
  reply(answer: string): string {
    const prettyAnswer = answer.trim().toLocaleLowerCase();
    this.currentQuestion = this.findNextQuestion(prettyAnswer);
    return this.currentQuestion.question;
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
   * Indexes a list of questions to object which keys are questions' ids.
   * @param questions A list of questions to be indexed.
   */
  private indexQuestions(questions: any): QuestionsType {
    return R.indexBy(R.prop("id"), questions);
  }

  /**
   * Verifies that questions param is in the required format or throws an error.
   * @param questions Questions
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
   * @param answerOptions AnswerOptions
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

  /**
   * Returns next question based on answer.
   *
   * Returns next question in question tree if answer exactly matches previous question's answerOption.
   * If next question not found tries to guess the next question and returns confirmation question if guess succeeds.
   * Otherwise returns error question.
   * @param answer User's answer
   */
  private findNextQuestion(answer: string): QuestionType {
    if (this.shouldStartNewConversation(answer)) {
      return this.questions[this.startQuestionId];
    }

    if (!answer || (!this.currentQuestion && answer)) {
      return ConversationChatBot.getErrorQuestion(this.currentQuestion);
    }

    const answerOption = this.findAnswerOption(answer);

    if (answerOption) {
      return this.questions[answerOption.nextState];
    }

    const quessQuestion = this.findGuessNextQuestion(answer);

    if (quessQuestion) {
      return quessQuestion;
    }

    return ConversationChatBot.getErrorQuestion(this.currentQuestion);
  }

  /**
   * Returns current question's answerOption exactly matching to an answer or undefined
   * @param answer User's answer
   */
  private findAnswerOption(answer: string): AnswerOption | undefined {
    return R.find(
      R.pipe(R.prop("answer"), R.toLower, R.equals(answer)),
      this.currentQuestion!.answerOptions!,
    );
  }

  /**
   * Tries to find possible next question based on an answer.
   *
   * If finds exactly one possible next question returns confirmation question.
   * Otherwise returns undefined.
   * @param answer User's answer
   */
  private findGuessNextQuestion(answer: string): QuestionType | undefined {
    if (
      !this.currentQuestion ||
      !this.currentQuestion.answerOptions ||
      this.currentQuestion.id === "guess"
    ) {
      return undefined;
    }

    const guesses = this.currentQuestion.answerOptions.filter(a =>
      answer.includes(a.answer.toLocaleLowerCase()),
    );

    if (guesses.length === 1) {
      return ConversationChatBot.getGuessQuestion(
        this.currentQuestion,
        guesses[0],
      );
    }

    return undefined;
  }

  private shouldStartNewConversation(answer: string): boolean {
    return (
      (!this.currentQuestion || !this.currentQuestion.answerOptions) && !answer
    );
  }

  private static getErrorQuestion(
    question: QuestionType | undefined,
  ): QuestionType {
    return {
      id: "error",
      question: "Sorry, I did't understand. Please, try again.",
      answerOptions: R.clone(R.path(["answerOptions"], question)),
    };
  }

  private static getGuessQuestion(
    question: QuestionType,
    answerOption: AnswerOption,
  ): QuestionType {
    return {
      id: "guess",
      question: `Did you mean '${answerOption.answer}'?`,
      answerOptions: [
        {
          answer: "Yes",
          nextState: answerOption.nextState,
        },
        {
          answer: "No",
          nextState: question.id,
        },
      ],
    };
  }
}
