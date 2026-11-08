export const THEME_KEY = "scoutknock-theme";

// Corre antes da primeira pintura, para quem escolheu o escuro não ver o claro a piscar.
// O claro é o tema por omissão.
export const THEME_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.classList.add("dark")}catch{}`;
