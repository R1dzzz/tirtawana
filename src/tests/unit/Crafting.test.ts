import { describe, it, expect } from 'vitest';
import { CraftingSystem } from '../../systems/CraftingSystem';
import { InventorySystem } from '../../systems/InventorySystem';
import { RECIPES } from '../../data/recipes/recipes';
import { NeedsSystem } from '../../systems/NeedsSystem';

function makeCraft() {
  const inv = new InventorySystem();
  const cs = new CraftingSystem(inv);
  return { inv, cs };
}

describe('CraftingSystem', () => {
  it('recipes are split by station', () => {
    const { cs } = makeCraft();
    const kitchen = cs.recipesFor('kitchen').map(r => r.id);
    const bench = cs.recipesFor('workbench').map(r => r.id);
    expect(kitchen).toContain('turnipa_stew');
    expect(kitchen).not.toContain('softwood_plank');
    expect(bench).toContain('animal_feed');
    expect(bench).not.toContain('boiled_egg');
  });

  it('craft consumes ingredients and produces output', () => {
    const { inv, cs } = makeCraft();
    inv.add('egg_fresh', 2);
    const r = cs.craft('boiled_egg');
    expect(r.ok).toBe(true);
    expect(inv.count('egg_fresh')).toBe(1);
    expect(inv.count('food_boiled_egg')).toBe(1);
  });

  it('craft fails with missing ingredients and consumes nothing', () => {
    const { inv, cs } = makeCraft();
    inv.add('crop_turnipa', 1); // stew needs 2
    const r = cs.craft('turnipa_stew');
    expect(r.ok).toBe(false);
    expect(inv.count('crop_turnipa')).toBe(1);
  });

  it('multi-ingredient recipes check all components', () => {
    const { inv, cs } = makeCraft();
    inv.add('crop_turnipa', 5);
    inv.add('milk_rich', 0);
    expect(cs.canCraft(RECIPES.turnipa_stew)).toBe(false);
    inv.add('milk_rich', 1);
    expect(cs.canCraft(RECIPES.turnipa_stew)).toBe(true);
  });

  it('workbench feed recipe converts 1 crop into 3 feed', () => {
    const { inv, cs } = makeCraft();
    inv.add('crop_turnipa', 1);
    expect(cs.craft('animal_feed').ok).toBe(true);
    expect(inv.count('animal_feed')).toBe(3);
    expect(inv.count('crop_turnipa')).toBe(0);
  });

  it('eating applies all four need effects', () => {
    const needs = new NeedsSystem(1000);
    needs.state.hunger = 40; needs.state.thirst = 40;
    needs.state.health = 60; needs.state.stamina = 40;
    CraftingSystem.eat(RECIPES.turnipa_stew.effects, {
      feed: (n) => needs.feed(n), drink: (n) => needs.drink(n),
      heal: (n) => needs.heal(n), energize: (n) => needs.energize(n)
    });
    expect(needs.state.hunger).toBe(100);
    expect(needs.state.health).toBe(80);
    expect(needs.state.stamina).toBe(70);
  });

  it('eating with no effects is safe (unknown food)', () => {
    const needs = new NeedsSystem(1000);
    const fx = CraftingSystem.eat(undefined, {
      feed: (n) => needs.feed(n), drink: (n) => needs.drink(n),
      heal: (n) => needs.heal(n), energize: (n) => needs.energize(n)
    });
    expect(fx).toEqual({});
    expect(needs.state.hunger).toBe(100); // unchanged (started full)
  });

  it('needs clamp at max (no overheal)', () => {
    const needs = new NeedsSystem(1000);
    needs.state.health = 95;
    needs.heal(50);
    expect(needs.state.health).toBe(100);
  });

  it('recipe outputs are registered items', () => {
    const { inv, cs } = makeCraft();
    for (const r of Object.values(RECIPES)) {
      for (const ing of r.ingredients) inv.add(ing.itemId, ing.quantity * 2);
    }
    for (const r of Object.values(RECIPES)) {
      const res = cs.craft(r.id);
      expect(res.ok, r.id).toBe(true);
    }
  });

  it('serialize/load preserves known recipes', () => {
    const { cs } = makeCraft();
    const cs2 = new CraftingSystem(new InventorySystem());
    cs2.load(cs.serialize());
    expect(cs2.recipesFor('kitchen').length).toBe(cs.recipesFor('kitchen').length);
  });
});
