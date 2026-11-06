const questionElement = document.querySelector("#question");
const statusElement = document.querySelector("#status");
const answerForm = document.querySelector("#answerForm");
const answersElement = document.querySelector("#answers");
const feedbackElement = document.querySelector("#feedback");
const scoreElement = document.querySelector("#score");
const categoryLabelElement = document.querySelector("#category-label");
const nextQuestionButton = document.querySelector("#next-question");
const retryButton = document.querySelector("#retry");

const categories = [
  { id: 17, name: "Science" },
  { id: 23, name: "History" },
  { id: 11, name: "Movies" },
  { id: 9, name: "General Knowledge" },
  { id: 10, name: "Books" },
  { id: 12, name: "Music" },
  { id: 14, name: "Television" },
  { id: 15, name: "Video Games" },
  { id: 18, name: "Computers" },
  { id: 20, name: "Mythology" },
  { id: 21, name: "Sports" },
  { id: 22, name: "Geography" },
  { id: 27, name: "Animals" },
];

let correctAnswer = "";
let score = 0;
let ultimateCategoryDeck = [];
let currentCategory = null;

function decodeHtml(text) {
  const decoder = document.createElement("textarea");
  decoder.innerHTML = text;
  return decoder.value;
}

function setLoading(isLoading) {
  statusElement.hidden = !isLoading;
  statusElement.textContent = isLoading ? "Loading a question…" : "";
  questionElement.hidden = isLoading;
  answerForm.hidden = isLoading;
  nextQuestionButton.hidden = true;
  retryButton.hidden = true;
}

async function getQuestion(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The trivia service returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  if (
    data.response_code !== 0 ||
    !Array.isArray(data.results) ||
    data.results.length === 0
  ) {
    throw new Error("The trivia service did not return a question.");
  }

  const result = data.results[0];
  if (
    typeof result.question !== "string" ||
    typeof result.correct_answer !== "string" ||
    !Array.isArray(result.incorrect_answers) ||
    result.incorrect_answers.length !== 3 ||
    result.incorrect_answers.some((answer) => typeof answer !== "string")
  ) {
    throw new Error("The trivia service returned an invalid question.");
  }

  return result;
}

function renderAnswers(result) {
  const options = [
    result.correct_answer,
    ...result.incorrect_answers,
  ].map(decodeHtml);

  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }

  correctAnswer = decodeHtml(result.correct_answer);
  answersElement.replaceChildren();

  options.forEach((answer, index) => {
    const label = document.createElement("label");
    label.className = "answer-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = answer;
    input.required = true;
    input.id = `answer-${index}`;

    const text = document.createElement("span");
    text.textContent = answer;

    label.htmlFor = input.id;
    label.append(input, text);
    answersElement.append(label);
  });
}

function shuffle(items) {
  const shuffledItems = [...items];
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [
      shuffledItems[swapIndex],
      shuffledItems[index],
    ];
  }
  return shuffledItems;
}

function getQuestionCategory(advanceUltimateCategory) {
  const categoryMode = document.body.dataset.category;

  if (categoryMode === "ultimate") {
    if (advanceUltimateCategory || !currentCategory) {
      if (ultimateCategoryDeck.length === 0) {
        ultimateCategoryDeck = shuffle(categories);
        if (
          currentCategory &&
          ultimateCategoryDeck[0].id === currentCategory.id
        ) {
          [ultimateCategoryDeck[0], ultimateCategoryDeck[1]] = [
            ultimateCategoryDeck[1],
            ultimateCategoryDeck[0],
          ];
        }
      }
      currentCategory = ultimateCategoryDeck.shift();
    }
    return currentCategory;
  }

  const requestedId =
    categoryMode === "dynamic"
      ? Number(new URLSearchParams(window.location.search).get("category"))
      : Number(categoryMode);
  const category = categories.find((item) => item.id === requestedId);
  if (!category) {
    throw new Error("Choose a valid trivia category to play.");
  }
  return category;
}

async function loadQuestion(advanceUltimateCategory = false) {
  setLoading(true);
  feedbackElement.textContent = "";
  feedbackElement.className = "feedback";

  try {
    const category = getQuestionCategory(advanceUltimateCategory);
    if (categoryLabelElement) {
      categoryLabelElement.textContent = `Category: ${category.name}`;
      categoryLabelElement.hidden = document.body.dataset.category !== "ultimate";
    }
    if (document.body.dataset.category === "dynamic") {
      document.querySelector("#page-title").textContent = `${category.name} Trivia`;
      document.querySelector("#category-eyebrow").textContent =
        `${category.name} challenge`;
      document.title = `${category.name} Trivia | Trivia Universe`;
    }

    const result = await getQuestion(
      `https://opentdb.com/api.php?amount=1&category=${category.id}&type=multiple`
    );

    renderAnswers(result);
    questionElement.textContent = decodeHtml(result.question);
    statusElement.hidden = true;
    questionElement.hidden = false;
    answerForm.hidden = false;
    answerForm.querySelector("button").disabled = false;
    answersElement.querySelector("input").focus();
  } catch (error) {
    statusElement.hidden = false;
    statusElement.textContent =
      error instanceof Error
        ? `${error.message} Please try again.`
        : "Unable to load a question. Please try again.";
    questionElement.hidden = true;
    answerForm.hidden = true;
    retryButton.hidden = false;
  }
}

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const selectedAnswer = new FormData(answerForm).get("answer");
  if (typeof selectedAnswer !== "string") {
    answersElement.querySelector("input").focus();
    return;
  }

  answersElement.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
  });
  answerForm.querySelector("button").disabled = true;

  if (
    selectedAnswer.localeCompare(correctAnswer, undefined, {
      sensitivity: "accent",
    }) === 0
  ) {
    score += 1;
    scoreElement.textContent = `Score: ${score}`;
    feedbackElement.textContent = "Correct! Great job.";
    feedbackElement.classList.add("correct");
  } else {
    feedbackElement.textContent = `Not quite. The correct answer is ${correctAnswer}.`;
    feedbackElement.classList.add("incorrect");
  }

  nextQuestionButton.hidden = false;
});

nextQuestionButton.addEventListener("click", () => loadQuestion(true));
retryButton.addEventListener("click", () => loadQuestion(false));

loadQuestion();
