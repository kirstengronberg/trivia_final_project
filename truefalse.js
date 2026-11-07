const questionElement = document.querySelector("#question");
const statusElement = document.querySelector("#status");
const answerForm = document.querySelector("#answerForm");
const answersElement = document.querySelector("#answers");
const feedbackElement = document.querySelector("#feedback");
const scoreElement = document.querySelector("#score");
const categoryLabelElement = document.querySelector("#category-label");
const nextQuestionButton = document.querySelector("#next-question");
const retryButton = document.querySelector("#retry");

// 1. LOCAL FALLBACK TRIVIA DATABASE (Keeps game playable when API is rate-limited)
const fallbackQuestions = [
  { category: "Science", question: "The common cold is caused by a virus, not by cold weather.", correct_answer: "True" },
  { category: "History", question: "The Magna Carta was signed by King John at Runnymede in 1215.", correct_answer: "True" },
  { category: "Film", question: "The movie 'Avatar' released in 2009 is the highest-grossing film of all time.", correct_answer: "True" },
  { category: "General Knowledge", question: "An octopus has three hearts, nine brains, and blue blood.", correct_answer: "True" },
  { category: "Literature", question: "In the novel 'Moby-Dick', the narrator is a character named Ishmael.", correct_answer: "True" },
  { category: "Music", question: "The Beatles' song 'Yesterday' was originally titled 'Scrambled Eggs'.", correct_answer: "True" },
  { category: "Television", question: "The character Sheldon Cooper appears in the sitcom 'The Big Bang Theory'.", correct_answer: "True" },
  { category: "Gaming", question: "The 2005 video game 'Call of Duty 2: Big Red One' is not available on PC.", correct_answer: "True" },
  { category: "Technology", question: "HTML stands for HyperText Markup Language.", correct_answer: "True" },
  { category: "Mythology", question: "In Greek mythology, Zeus is the king of the gods.", correct_answer: "True" },
  { category: "Sports", question: "A standard soccer match lasts for exactly 90 minutes of regular play time.", correct_answer: "True" },
  { category: "Geography", question: "The Amazon River is the longest river in the world.", correct_answer: "False" },
  { category: "Animals", question: "A group of flamingos is legally referred to as a 'flamboyance'.", correct_answer: "True" }
];

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

let correctAnswer = "";
let score = 0;
const selectedCategoryId = Number(new URLSearchParams(window.location.search).get("category"));
const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

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
  if (data.response_code !== 0 || !Array.isArray(data.results) || data.results.length === 0) {
    throw new Error("The trivia service did not return a question.");
  }

  const result = data.results[0];
  if (
    typeof result.question !== "string" ||
    typeof result.correct_answer !== "string" ||
    !Array.isArray(result.incorrect_answers) ||
    result.incorrect_answers.length !== 1
  ) {
    throw new Error("The trivia service returned an invalid question layout.");
  }

  return result;
}

function renderTrueFalseOptions(result) {
  const options = ["True", "False"];
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

async function loadQuestion() {
  setLoading(true);
  feedbackElement.textContent = "";
  feedbackElement.className = "feedback";

  const category = selectedCategory;
  if (categoryLabelElement) {
    categoryLabelElement.textContent = `Category: ${category.name}`;
    categoryLabelElement.hidden = false;
  }

  try {
    const result = await getQuestion(
      `https://opentdb.com/api.php?amount=1&category=${category.id}&type=boolean`
    );

    renderTrueFalseOptions(result);
    questionElement.textContent = decodeHtml(result.question);
  } catch (error) {
    console.warn("Unable to load a live True/False question. Using a local fallback.", error);
    
    const matchedQuestions = fallbackQuestions.filter(q => q.category === category.name);
    const selectedFallback = matchedQuestions[0];

    if (!selectedFallback) {
      statusElement.hidden = false;
      questionElement.hidden = true;
      answerForm.hidden = true;
      statusElement.textContent = "Couldn't load a question for this category. Check your connection and try again.";
      retryButton.hidden = false;
      return;
    }

    if (categoryLabelElement) {
      categoryLabelElement.textContent = `Category: ${selectedFallback.category} (Offline Mode)`;
    }

    const mockResult = {
      correct_answer: selectedFallback.correct_answer,
      incorrect_answers: [selectedFallback.correct_answer === "True" ? "False" : "True"]
    };

    renderTrueFalseOptions(mockResult);
    questionElement.textContent = selectedFallback.question;
  }

  statusElement.hidden = true;
  questionElement.hidden = false;
  answerForm.hidden = false;
  answerForm.querySelector("button").disabled = false;

  const initialInput = answersElement.querySelector("input");
  if (initialInput) initialInput.focus();
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

  if (selectedAnswer.localeCompare(correctAnswer, undefined, { sensitivity: "accent" }) === 0) {
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

nextQuestionButton.addEventListener("click", () => loadQuestion());
retryButton.addEventListener("click", loadQuestion);

if (!selectedCategory) {
  window.location.replace("categories.html?type=boolean");
} else {
  document.title = `${selectedCategory.name} True/False Trivia | Trivia Universe`;
  loadQuestion();
}
