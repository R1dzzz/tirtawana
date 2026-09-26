import { RECIPES } from '../data/recipes/recipes';
import { RecipeData, CraftResult, FoodEffect } from '../data/types/RecipeTypes';
import { InventorySystem } from './InventorySystem';

export class CraftingSystem {
  private inventory: InventorySystem;
  private knownRecipes = new Set<string>();

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;
    for (const id of Object.keys(RECIPES)) this.knownRecipes.add(id);
  }

  recipesFor(station: 'kitchen' | 'workbench'): RecipeData[] {
    return Object.values(RECIPES).filter(r => r.station === station && this.knownRecipes.has(r.id));
  }

  canCraft(recipe: RecipeData): boolean {
    return recipe.ingredients.every(ing => this.inventory.count(ing.itemId) >= ing.quantity);
  }

  craft(recipeId: string): CraftResult {
    const recipe = RECIPES[recipeId];
    if (!recipe || !this.knownRecipes.has(recipeId)) return { ok: false, message: 'Unknown recipe' };
    if (!this.canCraft(recipe)) return { ok: false, message: 'Missing ingredients' };
    for (const ing of recipe.ingredients) this.inventory.remove(ing.itemId, ing.quantity);
    this.inventory.add(recipe.outputItemId, recipe.outputQuantity);
    return { ok: true, message: `Made ${recipe.name}` };
  }

  /** Apply a food's effects to needs. Returns the effect for display. */
  static eat(effects: FoodEffect | undefined, needs: {
    feed: (n: number) => void; drink: (n: number) => void;
    heal: (n: number) => void; energize: (n: number) => void;
  }): FoodEffect {
    const e = effects ?? {};
    if (e.hunger) needs.feed(e.hunger);
    if (e.thirst) needs.drink(e.thirst);
    if (e.health) needs.heal(e.health);
    if (e.stamina) needs.energize(e.stamina);
    return e;
  }

  serialize(): string[] { return [...this.knownRecipes]; }
  load(ids: string[]): void {
    this.knownRecipes = new Set(ids.filter(id => RECIPES[id]));
  }
}
