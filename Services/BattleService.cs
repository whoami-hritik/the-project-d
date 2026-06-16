using System.ComponentModel.DataAnnotations;
using System.Net.Http.Headers;
using monster_world.Models;

namespace monster_world.Services
{
    public class BattleState
    {
        [Key]
        public Guid BattleId { get; set; }
        public long PlayerId { get; set; }
        public Monster PlayerMonster { get; set; }
        public Monster EnemyMonster { get; set; }
        public MonsterState PlayerState { get; set; }
        public MonsterState EnemyState { get; set; }
        public BattleStatus Status { get; set; }
        public bool BossBattle { get; set; }
        public string Map { get; set; }
        public DateTime StartedAt { get; set; }
        public int TurnCount { get; set; }
        public List<string> PlayerActiveSkills { get; set; } = new();
        public List<string> EnemyActiveSkills { get; set; } = new();
        public string? PlayerLastEffect { get; set; } = null;
        public string? EnemyLastEffect { get; set; } = null;
        public string? PlayerCooldownSkill { get; set; } = null;
        public string? EnemyCooldownSkill { get; set; } = null;
        public bool RewardProcessed { get; set; } = false;
        public bool Victory { get; set; } = false;
        public Items BattleConusmable = new();
    
    }

    public class MonsterState
    {
        public int Energy { get; set; }
        public bool   Rage       { get; set; }
        public bool   Sick       { get; set; }
        public bool   Hypno      { get; set; }
        public bool   JustMissed { get; set; }
        public int    Atk   { get; set; }
        public int    Def   { get; set; }
        public int    Aim   { get; set; }
        public int    PendingHeal{ get; set; }

        public MonsterState()
        {
            Energy = 100;
            Rage = false;
            Sick = false;
            Hypno = false;
            JustMissed = false;
            Atk = 0;
            Def = 0;
            Aim = 100;
            PendingHeal = 0;
        }

        public MonsterState(Monster monster)
        {
            Energy = 100;
            Rage = false;
            Sick = false;
            Hypno = false;
            JustMissed = false;
            Atk = monster.ATK;
            Def = monster.DEF;
            Aim = 100;
            PendingHeal = 0;
        }
    }

    public class AttackResult
    {
        public bool   Missed     { get; set; }
        public bool   Backfired  { get; set; }
        public bool   IsCrit     { get; set; }
        public int    Damage     { get; set; }
        public double  ElementMultiplier { get; set; }


        public static AttackResult Miss()                      => new() { Missed = true };
        public static AttackResult Backfire(int dmg)          => new() { Backfired = true, Damage = dmg };
        public static AttackResult Hit(int dmg, bool crit, double elementMultiplier) => new() { Damage = dmg, IsCrit = crit, ElementMultiplier = elementMultiplier };
        public static AttackResult NoEffect()                 => new();
    }

    public class BattleService
    {
        private readonly GameplayService _gameplayService;
        public BattleService(GameplayService monsterService)
        {
            _gameplayService = monsterService;
        }

        public class BOSS
        {

            public string Map { get; set; }
            public List<string> BOSSES { get; set; } = new();
            public DateTime Day { get; set; }
            public DateTime StartingAt { get; set; }
            public DateTime EndingAt { get; set; }
            public bool Active { get; set; }
            public double USDTCap { get; set; }
            public int TotalPlayers { get; set; }
            public List<long> PlayerIds { get; set; } = new();
        }


        public class BossBattle
        {
            [Key]
            public Guid Id { get; set; }
            public DateTime Date { get; set; }
            public int TotalBossBattles { get; set; }
            public List<BOSS> MapBosses { get; set; } = new();
            public double TotalUSDTCap { get; set; }
            public List<Guid> BattleIds { get; set; } = new();
        }

        
     
        public BattleState CreateBattle(Monster playerMonster, Monster enemyMonster)
        {
            BattleState battle = new()
            {
                PlayerMonster = playerMonster,
                EnemyMonster = enemyMonster,
                PlayerState = new MonsterState(playerMonster),
                EnemyState = new MonsterState(enemyMonster),
                Status = BattleStatus.Active,
                TurnCount = 0,
                PlayerActiveSkills = new List<string>(),
                EnemyActiveSkills = new List<string>(),
                PlayerLastEffect = null,
                EnemyLastEffect = null,
            };
            return battle;
        }

        
        public List<string> GetActiveSkills(Monster Monster)
        {
            var def = _gameplayService.GetMonsDef(Monster.Id);
            var skills = def.Abilities
                .Where(a => a.GetsAt <= Monster.Level)
                .Select(a => a.SkillId)
                .Where(id => _gameplayService.GetSkillDef(id) != null)
                .ToList();

            if (!skills.Any()) return new List<string>();

            Random rnd = new Random();
            var active = new List<string>();

            while (active.Count < Math.Min(3, skills.Count))
            {
                var idx = rnd.Next(skills.Count);
                var skillId = skills[idx];
                if (!active.Contains(skillId))
                {
                    active.Add(skillId + "-" + rnd.Next(10000));
                }
            }
            return active;
        }

        public string PickSkill(Monster Monster)
        {
            var def = _gameplayService.GetMonsDef(Monster.Id);
            var skills = def.Abilities
                .Where(a => a.GetsAt <= Monster.Level)
                .Select(a => a.SkillId)
                .Where(id => _gameplayService.GetSkillDef(id) != null)
                .ToList();

            if (!skills.Any()) return null;

            return skills[new Random().Next(skills.Count)];
        }

        public string PickOpponentSkill(Monster opponent, string cooldown)
        {
            var def = _gameplayService.GetMonsDef(opponent.Id);
            var skills = def.Abilities
                .Where(a => a.GetsAt <= opponent.Level)
                .Select(a => a.SkillId)
                .Where(id => _gameplayService.GetSkillDef(id) != null)
                .ToList();

            if (!skills.Any()) return null;

            string cooldownBase = cooldown?.Split('-', 2)[0];
            var available = skills
                .Where(s => s != cooldownBase)
                .ToList();

            if (!available.Any())
                return skills[new Random().Next(skills.Count)];

            return available[new Random().Next(available.Count)];
        }

        private static bool RollChance(int n, int d)
            => new Random().Next(1, d + 1) <= n;

        public bool Between(int value, string num, string mode = ":")
        {
            int num1 = int.Parse(num.Split(mode)[0]);
            int num2 = int.Parse(num.Split(mode)[1]);

            if (value >= num1 && value <= num2)
            {
                return true;
            }
            return false;
        }

        private static (int, int) ParseRatio(string value)
        {
            var p = value.Split(':');
            return (int.Parse(p[0]), int.Parse(p[1]));
        }

        private static (int, int) ParseRange(string value)
        {
            var p = value.Split('-');
            return (int.Parse(p[0]), int.Parse(p[1]));
        }

        public class VictoryReward
        {
            public Balance Balance { get; set; }
            public Items Items { get; set; }
        } 

        

    
        public class AttackResults
        {
            public AttackResult PlayerAttack { get; set; }
            public AttackResult EnemyAttack { get; set; }
        }


        

        public AttackResult PlayerAttack(
            ref BattleState battle,
            string skillId,
            ref MonsterState attackerState, 
            ref MonsterState defenderState )
        {
            string lastSkillId = skillId.Split('-', 2)[0];
            SkillDef lastSkill = _gameplayService.GetSkillDef(lastSkillId);
            if (lastSkill == null)
            {
                Console.WriteLine($"[Alert] PlayerAttack: unknown skill '{lastSkillId}'");
                return AttackResult.NoEffect();
            }

            var newSkillId = PickSkill(battle.PlayerMonster);
            if (newSkillId == null) 
            {
                Console.WriteLine("[Alert] New Skill Id is NULL");
                return AttackResult.NoEffect();
            }

            SkillDef newSkill = _gameplayService.GetSkillDef(newSkillId);
            if (newSkill == null)
            {
                // fallback: try to reuse any currently active skill with a valid definition
                newSkillId = battle.PlayerActiveSkills?
                    .Select(s => s.Split('-', 2)[0])
                    .FirstOrDefault(id => _gameplayService.GetSkillDef(id) != null);

                if (newSkillId == null)
                {
                    Console.WriteLine($"[Alert] PlayerAttack: could not resolve new skill '{newSkillId}'");
                    return AttackResult.NoEffect();
                }

                newSkill = _gameplayService.GetSkillDef(newSkillId);
            }

            newSkillId = newSkill.Id + "-" + Random.Shared.Next(00000, 99999);

                //add energy

            if (lastSkill.EnergyCost > 0)
            {
                attackerState.Energy = Math.Max(0, attackerState.Energy - lastSkill.EnergyCost);
            }

            if (lastSkill.Cooldown > 0 && newSkill.Cooldown > 0 && lastSkill.Id == newSkill.Id)
            {
                battle.PlayerCooldownSkill = newSkillId;
            }
            else
            {
                battle.PlayerCooldownSkill = null;
            }

            int index = battle.PlayerActiveSkills.IndexOf(skillId);

            if (index != -1)
            {
                if (skillId.EndsWith("-consumable") || battle.PlayerActiveSkills.Count > 3)
                {
                    //do not replace skill
                    battle.PlayerActiveSkills.Remove(skillId);
                }
                else
                {
                    battle.PlayerActiveSkills[index] = newSkillId;
                }
            }
    
            AttackResult attackRes = ResolveAttack(battle.PlayerMonster, battle.EnemyMonster, lastSkill, attackerState, defenderState, lastSkill);
            battle.PlayerLastEffect = lastSkillId;

            // FIX 3: track JustMissed for mercy mechanic next turn
            attackerState.JustMissed = attackRes.Missed;

            if (attackRes.Missed)
            {
                // no HP change on miss
            }
            else if (attackRes.Backfired)
            {
                battle.PlayerMonster.HP -= attackRes.Damage;
            }
            else
            {
                battle.EnemyMonster.HP -= attackRes.Damage;
                // FIX 4: apply SICK damage to defender each turn
                if (defenderState.Sick)
                    battle.EnemyMonster.HP -= _gameplayService.GetBattleData().SickDamage;
            }

            // Apply pending heal to attacker (from skills like enflame, revive)
            battle.PlayerMonster.HP += attackerState.PendingHeal;
            attackerState.PendingHeal = 0; // reset after applying
            return attackRes;

        }

        public AttackResult EnemyAttack(
            ref BattleState battle,
            ref MonsterState attackerState, 
            ref MonsterState defenderState )
        {
            if (battle == null || battle.EnemyMonster == null || battle.PlayerMonster == null)
                return AttackResult.NoEffect();

            var enemyActiveSkills = battle.EnemyActiveSkills;
            string enemyCooldownSkill = battle.EnemyCooldownSkill;
            var availableSkills = enemyActiveSkills?
                .Where(s => s != enemyCooldownSkill)
                .ToList();

            if (availableSkills == null || !availableSkills.Any())
                return AttackResult.NoEffect();

            Random rnd = new Random();
            string skillId = availableSkills[rnd.Next(availableSkills.Count)];

            if (string.IsNullOrEmpty(skillId))
                return AttackResult.NoEffect();

            string lastSkillId = skillId.Split('-', 2)[0];
            SkillDef lastSkill = _gameplayService.GetSkillDef(lastSkillId);
            if (lastSkill == null)
                return AttackResult.NoEffect();

            var newSkillId = PickOpponentSkill(battle.EnemyMonster, battle.EnemyCooldownSkill);
            if (string.IsNullOrEmpty(newSkillId))
                return AttackResult.NoEffect();

            SkillDef newSkill = _gameplayService.GetSkillDef(newSkillId);
            if (newSkill == null)
                return AttackResult.NoEffect();

            newSkillId = newSkill.Id + "-" + Random.Shared.Next(00000, 99999);

            if (lastSkill.Cooldown > 0 && newSkill.Cooldown > 0 && lastSkill.Id == newSkill.Id)
            {
                battle.EnemyCooldownSkill = newSkillId;
            }
            else
            {
                battle.EnemyCooldownSkill = null;
            }

            int index = battle.EnemyActiveSkills.IndexOf(skillId);

            if (index != -1)
            {
                battle.EnemyActiveSkills[index] = newSkillId;
            }

            AttackResult attackRes = ResolveAttack(battle.EnemyMonster, battle.PlayerMonster, lastSkill, attackerState, defenderState, lastSkill);
            battle.EnemyLastEffect = lastSkillId;

            // FIX 3: track JustMissed for mercy mechanic next turn
            attackerState.JustMissed = attackRes.Missed;

            if (attackRes.Missed)
            {
                // no HP change on miss
            }
            else if (attackRes.Backfired)
            {
                battle.EnemyMonster.HP -= attackRes.Damage;
            }
            else
            {
                battle.PlayerMonster.HP -= attackRes.Damage;
                // FIX 4: apply SICK damage to defender each turn
                if (defenderState.Sick)
                    battle.PlayerMonster.HP -= _gameplayService.GetBattleData().SickDamage;
            }

            // FIX 5: enemy heals ITSELF (attackerState), not the player (defenderState)
            battle.EnemyMonster.HP += attackerState.PendingHeal;
            attackerState.PendingHeal = 0; // reset after applying

            return attackRes;
        }

        private static Random random = new();
        public AttackResult ResolveAttack(
            Monster attacker,
            Monster defender,
            SkillDef skill,
            MonsterState attackerState,      // rage, hypno, sick flags
            MonsterState defenderState,
            SkillDef lastSkill)
        {

            
            if (attacker == null)
                throw new ArgumentNullException(nameof(attacker), "Attacker cannot be null.");

            if (defender == null)
                throw new ArgumentNullException(nameof(defender), "Defender cannot be null.");

            var bd      = _gameplayService.GetBattleData();
            var defDef  = _gameplayService.GetMonsDef(defender.Id);
        
            // --- STEP 1: Miss check ---
            if (!skill.NoMiss)
            {
                MissChance chance = bd.MissChance.FirstOrDefault(x => Between(attackerState.Aim, x.Aim)) ?? new MissChance { Miss = 0 };

                if (random.NextDouble() <= chance.Miss)
                {
                    return AttackResult.Miss();
                }
            }

            // --- STEP 1B: SPD-based Dodge (Evasion) ---
            if (!skill.NoMiss)
            {
                int spdDiff = attacker.SPD - defender.SPD;
                if (spdDiff < 0)  // Defender is faster
                {
                    double dodgeChance = (double)Math.Abs(spdDiff) / (attacker.SPD + defender.SPD + 1);
                    if (random.NextDouble() < dodgeChance)
                    {
                        return AttackResult.Miss();  // Speed-based dodge
                    }
                }
            }

            // --- STEP 2: Backfire check (if attacker is hypno'd) ---
            bool backfired = false;
            if (attackerState.Hypno && !skill.NoBackFire)
            {
                var (bfN, bfD) = ParseRatio(bd.HypnoBackfireChance); // "1:2"
                if (RollChance(bfN, bfD))
                {
                    backfired = true;
                }
            }

            if (backfired)
            {
                ApplyEffects(lastSkill, defender, attacker, ref defenderState, ref attackerState);
                int backfireDmg = (int)((skill.Effects.AttackMultiplier ?? 0.0) * bd.BackfireDamageFactor);
                return AttackResult.Backfire(Math.Max(1, backfireDmg));
            }
            else
            {
                ApplyEffects(lastSkill, attacker, defender, ref attackerState, ref defenderState);
            }

            // --- STEP 3: Compute base damage ---
            if (skill.Effects.AttackMultiplier.HasValue)
            {
            
                double damage    =  (double) (attackerState.Atk * skill.Effects.AttackMultiplier);

                // --- STEP 4: Type advantage (skill kind vs defender monster kind) ---
                double elementMultiplier = _gameplayService.ElementMultiplier(attacker.Element, defender.Element);
                damage *= elementMultiplier;

                // --- STEP 5: Rage ---
                if (attackerState.Rage)
                {
                    damage *= bd.RageFactor;
                    attackerState.Rage = false;
                }
                    

                // --- STEP 6: Extra damage condition ---
                if (skill.ExtraWhen == "self_hurt" && attacker.HP <= 100 * bd.ExtraByHurtThreshold)
                {
                    damage *= bd.ExtraDamageFactor;
                }
                    
                if (skill.ExtraWhen == "sick" && defenderState.Sick)
                {
                    damage *= bd.ExtraDamageFactor;
                }
                    

                bool isCrit = false;
                double critChance = bd.CritChance.FirstOrDefault(x => Between(attacker.HP, x.HpWhen))?.Crit ?? 0;
                if (random.NextDouble() <= critChance)
                {
                    damage *=  bd.CriticalDamage;
                    isCrit = true;
                }

                // apply defender's defense as a damage reduction factor
                // finalDamage = damage * (100 / (100 + DEF)) rounded and at least 1
                int finalDamage = Math.Max(1, (int)Math.Round(damage * 100.0 / (100 + defenderState.Def)));

                return AttackResult.Hit(finalDamage, isCrit, elementMultiplier);
            }

            return AttackResult.NoEffect();
        }

        public void ApplyEffects(SkillDef skill, Monster attacker, Monster defender, ref MonsterState attackerState, ref MonsterState defenderState)
        {
            var fx = skill.Effects;  //all effects for the skill

            // Status effects (probabilistic)
            if (fx.StateSick != null)
            { 
                var (numerator,denomrator) = ParseRatio(fx.StateSick);
                if (RollChance(numerator,denomrator))
                {
                    defenderState.Sick  = true;
                } 
            }
            if (fx.StateHypno != null)
            { 
                var (numerator,denomrator) = ParseRatio(fx.StateHypno);
                if (RollChance(numerator,denomrator)) 
                {
                    defenderState.Hypno = true; 
                }
            }
            if (fx.StateRage  != null) {
                var (n,d) = ParseRatio(fx.StateRage);
                if (RollChance(n,d)) 
                {
                    attackerState.Rage  = true;
                    attackerState.Sick  = false;
                    attackerState.Hypno = false;
                }
            }

            // Stat changes (applied to attacker)
            if (fx.IncrAttack.HasValue)
            {
                attackerState.Atk = attackerState.Atk + (int)(attackerState.Atk * fx.IncrAttack.Value);
            }
            if (fx.DecrAttack.HasValue)
            {
                defenderState.Atk = Math.Max(0, defenderState.Atk - (int)(defenderState.Atk * fx.DecrAttack.Value));
            }
            if (fx.IncrDefense.HasValue)
            { 
                attackerState.Def = attackerState.Def + (int)(attackerState.Def * fx.IncrDefense.Value);
            }
            if (fx.DecrDefense.HasValue)
            {
                defenderState.Def =  Math.Max(0, defenderState.Def - (int)(defenderState.Def * fx.DecrDefense.Value));
            }
            if (fx.IncrAim.HasValue)
            {
                attackerState.Aim = Math.Min(100, attackerState.Aim + (int) (attackerState.Aim * fx.IncrAim.Value));
            }
            if (fx.DecrAim.HasValue)
            {
                defenderState.Aim = Math.Max(0, defenderState.Aim -(int)(defenderState.Aim * fx.DecrAim.Value));
            }

            
            if (fx.HealPercent != null)
            {
                var (min, max) = ParseRange(fx.HealPercent); // "15-25"
                int pct  = random.Next(min, max + 1);
                int heal = (int)Math.Round(attacker.MaxHP * pct / 100.0); 
                attackerState.PendingHeal = heal;
            }
        }
    }
}
