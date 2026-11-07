// Shared by the server layout and the client night store (kept out of the
// "use client" module so the layout can inline it as a plain string).

export const NIGHT_KEY = "garden-night";

/** Runs before first paint (inlined in layout.tsx) so a remembered night never flashes day first. */
export const NIGHT_BOOT = `try{if(localStorage.getItem("${NIGHT_KEY}")==="1"){var d=document.documentElement.dataset;d.lamp=d.night=d.nightInk="1"}}catch(e){}`;
