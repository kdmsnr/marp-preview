const container = document.getElementById('marp-container');

function hasRenderablePayload(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.html === 'string' &&
    typeof data.css === 'string'
  );
}

window.electronAPI.onMarpRendered((data) => {
  if (hasRenderablePayload(data)) {
    container.innerHTML = `<style>${data.css}</style>${data.html}`;
  } else {
    container.innerHTML =
      '<p style="color: red;">Error: Invalid data received.</p>';
  }
});
