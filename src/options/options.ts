import { ALL_FEATURES, buildDefaultSettings } from '../content/features';
import { loadSettings, saveSettings } from '../shared/settings';
import type { Settings } from '../shared/types';

async function init(): Promise<void> {
  const defaults = buildDefaultSettings();
  const settings: Settings = await loadSettings(defaults);

  const container = document.getElementById('features');
  if (!container) return;

  for (const feature of ALL_FEATURES) {
    const card = document.createElement('div');
    card.className = 'feature-card';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `feature-${feature.id}`;
    checkbox.checked = settings[feature.id] ?? feature.defaultEnabled;

    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = '保存しました';

    checkbox.addEventListener('change', async () => {
      settings[feature.id] = checkbox.checked;
      await saveSettings(settings);
      status.classList.add('visible');
      window.setTimeout(() => status.classList.remove('visible'), 1500);
    });

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;

    const labelLine = document.createElement('div');
    const labelText = document.createElement('span');
    labelText.className = 'feature-label';
    labelText.textContent = feature.label;
    const idBadge = document.createElement('span');
    idBadge.className = 'feature-id';
    idBadge.textContent = feature.id;
    labelLine.appendChild(labelText);
    labelLine.appendChild(idBadge);
    labelLine.appendChild(status);

    const description = document.createElement('p');
    description.className = 'feature-description';
    description.textContent = feature.description;

    label.appendChild(labelLine);
    label.appendChild(description);

    card.appendChild(checkbox);
    card.appendChild(label);
    container.appendChild(card);
  }
}

init().catch((err) => {
  console.error('[github-plus] options init failed:', err);
});
