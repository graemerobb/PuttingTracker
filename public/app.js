const statusEl = document.getElementById("status");
document.getElementById("btn").addEventListener("click", () => {
  statusEl.textContent = `Clicked at ${new Date().toLocaleTimeString()}`;
});
