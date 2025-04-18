console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/" // Local server
  : "/portfolio/";

let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "https://github.com/nandapayyappilly", title: "GitHub" }
];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = !p.url.startsWith("http") ? BASE_PATH + p.url : p.url;
  let a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

    a.classList.toggle(
        "current",
        a.host === location.host && a.pathname === location.pathname
    );

    if (a.host !== location.host) {
        a.target = "_blank";
      }

    nav.append(a);
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );

// Get a reference to the <select> element
let select = document.querySelector('.color-scheme select');

// Define a function to set the color scheme
function setColorScheme(scheme) {
  document.documentElement.style.setProperty('color-scheme', scheme);
  select.value = scheme; // Update dropdown to reflect current value
}

// When the user changes the theme, update the color scheme and save preference
select.addEventListener('input', function (event) {
  let scheme = event.target.value;
  setColorScheme(scheme);
  localStorage.colorScheme = scheme; // Save to localStorage
});

// Load saved color scheme preference on page load
if ('colorScheme' in localStorage) {
    setColorScheme(localStorage.colorScheme);
}

// Get the form element
let form = document.querySelector('#contact-form');

// Only run this if the form exists (optional chaining avoids errors)
form?.addEventListener('submit', function (event) {
  event.preventDefault(); // Stop the form from submitting the default way

  let data = new FormData(form);
  let params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  // Construct final URL
  let url = form.action + '?' + params.join('&');

  // Open the email client with formatted URL
  location.href = url;
});

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
//   );

// currentLink?.classList.add("current");