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
  { id: 11, name: "Film" },
  { id: 9, name: "General Knowledge" },
  { id: 10, name: "Literature" },
  { id: 12, name: "Music" },
  { id: 14, name: "Television" },
  { id: 15, name: "Gaming" },
  { id: 18, name: "Technology" },
  { id: 20, name: "Mythology" },
  { id: 21, name: "Sports" },
  { id: 22, name: "Geography" },
  { id: 27, name: "Animals" },
];

const parameters = new URLSearchParams(window.location.search);
const category = categories.find((item) => item.id === Number(parameters.get("category")));
let correctAnswer = "";
let score = 0;

if (parameters.get("type") === "boolean") {
  window.location.replace(`truefalse.html${window.location.search}`);
} else if (!category) {
  window.location.replace("categories.html?type=multiple");
} else {
  document.title = `${category.name} Trivia | Trivia Universe`;
  document.querySelector("#page-title").textContent = `${category.name} Trivia`;
  document.querySelector("#category-eyebrow").textContent = `${category.name} challenge`;
  categoryLabelElement.textContent = `Category: ${category.name}`;
  categoryLabelElement.hidden = false;
  loadQuestion();
}

function decodeHtml(text) {
  const decoder = document.createElement("textarea");
  decoder.innerHTML = text;
  return decoder.value;
}

function shuffle(items) {
  const shuffledItems = [...items];
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
  }
  return shuffledItems;
}

async function loadQuestion() {
  statusElement.hidden = false;
  statusElement.textContent = "Loading a question…";
  questionElement.hidden = true;
  answerForm.hidden = true;
  nextQuestionButton.hidden = true;
  retryButton.hidden = true;
  feedbackElement.textContent = "";
  feedbackElement.className = "feedback";

  try {
    const response = await fetch(
      `https://opentdb.com/api.php?amount=1&category=${category.id}&type=multiple`
    );
    if (!response.ok) {
      throw new Error(`The trivia service returned HTTP ${response.status}.`);
    }

    const data = await response.json();
    const result = data.results?.[0];
    if (
      data.response_code !== 0 ||
      typeof result?.question !== "string" ||
      typeof result.correct_answer !== "string" ||
      !Array.isArray(result.incorrect_answers) ||
      result.incorrect_answers.length !== 3
    ) {
      throw new Error("The trivia service did not return a valid multiple-choice question.");
    }

    correctAnswer = decodeHtml(result.correct_answer);
    answersElement.replaceChildren();
    shuffle([...result.incorrect_answers, result.correct_answer]).forEach((answer, index) => {
      const label = document.createElement("label");
      label.className = "answer-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = decodeHtml(answer);
      input.required = true;
      input.id = `answer-${index}`;

      const text = document.createElement("span");
      text.textContent = decodeHtml(answer);
      label.htmlFor = input.id;
      label.append(input, text);
      answersElement.append(label);
    });

    questionElement.textContent = decodeHtml(result.question);
    questionElement.hidden = false;
    answerForm.hidden = false;
    statusElement.hidden = true;
    answerForm.querySelector("button").disabled = false;
    answersElement.querySelector("input").focus();
  } catch (error) {
    console.error("Unable to load trivia question.", error);
    statusElement.textContent = "Couldn't load a question. Check your connection and try again.";
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

  if (selectedAnswer === correctAnswer) {
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

nextQuestionButton.addEventListener("click", loadQuestion);
retryButton.addEventListener("click", loadQuestion);
