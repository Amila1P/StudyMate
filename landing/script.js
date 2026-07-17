const themeToggle = document.getElementById("themeToggle");
const darkModeClass = "dark-mode";
const storageKey = "studymate-theme";

function setTheme(isDark) {
	document.body.classList.toggle(darkModeClass, isDark);
	themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
}

const savedTheme = localStorage.getItem(storageKey);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialThemeIsDark = savedTheme ? savedTheme === "dark" : prefersDark;

setTheme(initialThemeIsDark);

themeToggle.addEventListener("click", () => {
	const isDark = !document.body.classList.contains(darkModeClass);
	setTheme(isDark);
	localStorage.setItem(storageKey, isDark ? "dark" : "light");
});
