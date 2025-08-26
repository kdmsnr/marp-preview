const container = document.getElementById('marp-container');

window.electronAPI.onMarpRendered((data) => {
  if (data && data.html && data.css) {
    container.innerHTML = `<style>${data.css}</style>${data.html}`;
  } else {
    container.innerHTML = '<p style="color: red;">Error: Invalid data received.</p>';
  }
});
