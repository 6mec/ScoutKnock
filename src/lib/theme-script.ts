export const THEME_KEY = "scoutknock-theme";

// Corre antes da primeira pintura, para quem escolheu o claro não ver o escuro a piscar.
export const THEME_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="light")document.documentElement.classList.remove("dark")}catch{}`;
