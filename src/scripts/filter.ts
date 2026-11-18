/**
 * 通用列表筛选：搜索 + 多组标签（组内或、组间与）。
 * 页面结构约定见 characters/weapons/items 列表页。
 */
export function initFilters() {
  document.querySelectorAll<HTMLElement>('[data-filter-root]').forEach((root) => {
    const search = root.querySelector<HTMLInputElement>('[data-filter-search]');
    const items = [...root.querySelectorAll<HTMLElement>('[data-filter-item]')];
    const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-facet-chip]')];
    const count = root.querySelector<HTMLElement>('[data-filter-count]');
    const empty = root.querySelector<HTMLElement>('[data-filter-empty]');
    const clear = root.querySelector<HTMLButtonElement>('[data-filter-clear]');
    const active = new Map<string, Set<string>>();

    const apply = () => {
      const q = (search?.value || '').trim().toLowerCase();
      let shown = 0;
      for (const el of items) {
        const text = (el.dataset.search || '').toLowerCase();
        const facets = (el.dataset.facet || '').split(' ');
        let ok = !q || q.split(/\s+/).every((w) => text.includes(w));
        if (ok) {
          for (const [group, values] of active) {
            if (!values.size) continue;
            const hit = facets.some((f) => {
              const [g, v] = f.split(':');
              return g === group && values.has(v);
            });
            if (!hit) {
              ok = false;
              break;
            }
          }
        }
        el.classList.toggle('hidden', !ok);
        if (ok) shown++;
      }
      if (count) count.textContent = String(shown);
      empty?.classList.toggle('hidden', shown !== 0);
    };

    chips.forEach((chip) => {
      const group = chip.dataset.group || '';
      const value = chip.dataset.value || '';
      chip.addEventListener('click', () => {
        if (!active.has(group)) active.set(group, new Set());
        const set = active.get(group)!;
        // 「全部」：清空该组
        if (value === 'all') {
          set.clear();
          chips
            .filter((c) => c.dataset.group === group)
            .forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
          apply();
          return;
        }
        // 单选组
        if (chip.dataset.single === 'true') {
          const isOn = set.has(value);
          set.clear();
          if (!isOn) set.add(value);
        } else if (set.has(value)) {
          set.delete(value);
        } else {
          set.add(value);
        }
        chips
          .filter((c) => c.dataset.group === group)
          .forEach((c) => c.setAttribute('aria-pressed', String(set.has(c.dataset.value || ''))));
        apply();
      });
    });

    search?.addEventListener('input', apply);
    clear?.addEventListener('click', () => {
      if (search) search.value = '';
      active.clear();
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      apply();
    });

    apply();

    // 支持 ?q= 与 ?tag=
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && search) {
      search.value = q;
      apply();
    }
    const tag = params.get('tag');
    if (tag) {
      const chip = chips.find((c) => c.dataset.value === tag);
      chip?.click();
    }
  });
}
