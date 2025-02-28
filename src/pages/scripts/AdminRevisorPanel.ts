
  // Script del lado del cliente para manejar la interactividad
  document.addEventListener('DOMContentLoaded', () => {
    const toggleInputs = document.querySelectorAll('.toggle-input');
    
    toggleInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const cardId = target.getAttribute('data-card-id');
        const cardContainer = document.querySelector(`.card-container[data-card-id="${cardId}"]`);
        const tableContainer = cardContainer?.querySelector('.table-container');
        
        if (tableContainer) {
          if (target.checked) {
            tableContainer.classList.remove('hidden');
          } else {
            tableContainer.classList.add('hidden');
          }
        }
        
        // Actualizar el estilo del toggle
        const toggleSlider = target.nextElementSibling;
        if (toggleSlider) {
          if (target.checked) {
            toggleSlider.classList.remove('bg-gray-300');
            toggleSlider.classList.add('bg-primary');
            (toggleSlider as HTMLElement).style.setProperty('--transform-x', '1.25rem');
          } else {
            toggleSlider.classList.remove('bg-primary');
            toggleSlider.classList.add('bg-gray-300');
            (toggleSlider as HTMLElement).style.setProperty('--transform-x', '0');
          }
        }
      });
    });
  });