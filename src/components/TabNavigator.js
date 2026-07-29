/**
 * TabNavigator.js — Lógica de navegación por pestañas
 * 
 * SRP: única responsabilidad = activar/desactivar tabs y sus paneles.
 */

/**
 * Inicializa la navegación de tabs.
 * @param {string} tabBtnSelector - Selector CSS de los botones de tab
 * @param {string} tabPaneSelector - Selector CSS de los paneles de tab
 */
export function TabNavigator(
  tabBtnSelector = '.tab-btn',
  tabPaneSelector = '.tab-pane'
) {
  const tabs = document.querySelectorAll(tabBtnSelector);
  const panes = document.querySelectorAll(tabPaneSelector);

  if (!tabs.length) {
    console.warn('[TabNavigator] No se encontraron tabs:', tabBtnSelector);
    return;
  }

  function activateTab(targetTabId) {
    tabs.forEach(t => t.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));

    const activeTab = [...tabs].find(t => t.dataset.tab === targetTabId);
    const activePane = document.getElementById(targetTabId);

    activeTab?.classList.add('active');
    activePane?.classList.add('active');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  // Activar la primera pestaña por defecto
  if (tabs[0]?.dataset.tab) {
    activateTab(tabs[0].dataset.tab);
  }

  return { activateTab };
}
