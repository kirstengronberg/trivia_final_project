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
const type = parameters.get("type") === "boolean" ? "boolean" : "multiple";
const triviaTypeName = type === "boolean" ? "True/False Trivia" : "Ultimate Trivia";
const categoryTitle = document.querySelector("#categories-title");

document.title = `Choose a Category | ${triviaTypeName}`;
categoryTitle.textContent = "Pick a Category";

document.querySelectorAll("[data-category-id]").forEach((card) => {
  const categoryId = Number(card.dataset.categoryId);
  const category = categories.find((item) => item.id === categoryId);
  if (!category) {
    throw new Error(`Unknown trivia category: ${card.dataset.categoryId}`);
  }

  const page = type === "boolean" ? "truefalse.html" : "category.html";
  card.href = `${page}?category=${category.id}&type=${type}`;
});
