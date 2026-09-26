import { describe, it, expect } from 'vitest';
import { RelationshipSystem } from '../../systems/RelationshipSystem';
import { NPCS } from '../../data/npcs/villagers';

const ctx = { hearts: 5, season: 'spring', hasItem: () => false, flag: () => false };

describe('RelationshipSystem', () => {
  it('every NPC has a dialogue tree with valid start node', () => {
    const rs = new RelationshipSystem();
    for (const id of Object.keys(NPCS)) {
      expect(rs.getTree(id), id).toBeDefined();
      const start = rs.getStartNode(id);
      expect(start, `${id} start`).not.toBeNull();
    }
  });

  it('tree links are valid (options and next point to real nodes)', () => {
    const rs = new RelationshipSystem();
    const { DIALOGUE_TREES } = require('../../data/dialogue/trees');
    for (const tree of Object.values(DIALOGUE_TREES) as any[]) {
      for (const node of Object.values(tree.nodes) as any[]) {
        if (node.next) expect(tree.nodes[node.next], `${tree.id}:${node.id}.next`).toBeDefined();
        for (const opt of node.options ?? []) {
          if (opt.next) expect(tree.nodes[opt.next], `${tree.id}:${node.id} opt`).toBeDefined();
        }
      }
    }
  });

  it('heart events trigger once at the right heart threshold', () => {
    const rs = new RelationshipSystem();
    rs.addFriendship('sari', 450); // 4 hearts
    const ev1 = rs.getStartNode('sari');
    expect(ev1?.id).toBe('heart4');
    // Second call falls back to normal start (event consumed)
    const ev2 = rs.getStartNode('sari');
    expect(ev2?.id).toBe('start');
  });

  it('romance gates: ask out at 6 hearts, propose at 10', () => {
    const rs = new RelationshipSystem();
    rs.addFriendship('sari', 550); // 5 hearts
    expect(rs.canAskOut('sari')).toBe(false);
    rs.addFriendship('sari', 100); // 6 hearts
    expect(rs.canAskOut('sari')).toBe(true);
    expect(rs.askOut('sari')).toBe(true);
    expect(rs.canPropose('sari')).toBe(false);
    rs.addFriendship('sari', 349); // 9 hearts (650+349=999)
    expect(rs.canPropose('sari')).toBe(false);
    rs.addFriendship('sari', 100); // 10 hearts
    expect(rs.canPropose('sari')).toBe(true);
    expect(rs.propose('sari')).toBe(true);
    expect(rs.getState('sari')?.married).toBe(true);
  });

  it('non-romanceable NPCs cannot be dated', () => {
    const rs = new RelationshipSystem();
    rs.addFriendship('pak_darma', 1000);
    expect(rs.canAskOut('pak_darma')).toBe(false);
    expect(rs.askOut('pak_darma')).toBe(false);
  });

  it('condition checker respects hearts/season/item/flag', () => {
    const { RelationshipSystem: RS } = require('../../systems/RelationshipSystem');
    expect(RS.checkCondition(undefined, ctx)).toBe(true);
    expect(RS.checkCondition({ minHearts: 4 }, ctx)).toBe(true);
    expect(RS.checkCondition({ minHearts: 6 }, ctx)).toBe(false);
    expect(RS.checkCondition({ season: 'spring' }, ctx)).toBe(true);
    expect(RS.checkCondition({ season: 'winter' }, ctx)).toBe(false);
    expect(RS.checkCondition({ hasItem: 'egg' }, ctx)).toBe(false);
    expect(RS.checkCondition({ hasItem: 'egg' }, { ...ctx, hasItem: () => true })).toBe(true);
  });

  it('hearts cap at 10 and never go negative', () => {
    const rs = new RelationshipSystem();
    rs.addFriendship('lila', 5000);
    expect(rs.getState('lila')?.hearts).toBe(10);
    rs.addFriendship('lila', -99999);
    expect(rs.getState('lila')?.friendship).toBe(0);
  });

  it('serialize/load preserves dating/married/seen events', () => {
    const rs = new RelationshipSystem();
    rs.addFriendship('sari', 650);
    rs.askOut('sari');
    rs.getStartNode('sari'); // consume heart event
    const rs2 = new RelationshipSystem();
    rs2.load(rs.serialize());
    const st = rs2.getState('sari')!;
    expect(st.dating).toBe(true);
    expect(st.hearts).toBe(6);
    expect(st.heartEventsSeen.length).toBeGreaterThan(0);
  });
});
