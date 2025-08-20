import { supabase } from './supabase';

async function checkOptimizations(): Promise<void> {
  console.error('🔍 VÉRIFICATION OPTIMISATIONS SUPABASE\n');
  console.error('='.repeat(50));

  const results = {
    indexes: false,
    views: false,
    functions: false,
    rls: false,
    gamificationTables: false,
  };

  // Vérifier les vues
  console.error('\n📊 VUES SQL:');
  const views = ['quiz_with_stats'];
  for (const view of views) {
    const { error } = await supabase.from(view).select('*').limit(1);
    if (error) {
      console.error(`❌ ${view}: N'existe pas`);
    } else {
      console.error(`✅ ${view}: Existe`);
      results.views = true;
    }
  }

  // Vérifier les fonctions
  console.error('\n🔧 FONCTIONS SQL:');
  const functions = [
    { name: 'get_user_statistics', params: { user_id: '00000000-0000-0000-0000-000000000000' } },
    {
      name: 'add_experience_points',
      params: { user_id: '00000000-0000-0000-0000-000000000000', points: 0 },
    },
  ];

  for (const func of functions) {
    try {
      await supabase.rpc(func.name, func.params);
      console.error(`✅ ${func.name}: Existe`);
      results.functions = true;
    } catch {
      console.error(`❌ ${func.name}: N'existe pas`);
    }
  }

  // Vérifier les tables de gamification
  console.error('\n🎮 TABLES GAMIFICATION:');
  const gamificationTables = ['experience_levels', 'achievements', 'user_achievements'];
  let allTablesExist = true;

  for (const table of gamificationTables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.error(`❌ ${table}: Manquante`);
      allTablesExist = false;
    } else {
      console.error(`✅ ${table}: Existe`);
    }
  }
  results.gamificationTables = allTablesExist;

  // Vérifier les index (via les tables)
  console.error('\n🔍 INDEX OPTIMISATION:');
  const indexChecks = [
    { table: 'sessions_quiz', column: 'user_id', name: 'idx_sessions_quiz_user' },
    { table: 'quiz', column: 'categorie_id', name: 'idx_quiz_categorie' },
    { table: 'questions', column: 'quiz_id', name: 'idx_questions_quiz' },
  ];

  // Pour vérifier les index, on fait une requête avec filtre et on regarde la performance
  let indexCount = 0;
  for (const idx of indexChecks) {
    const start = Date.now();
    await supabase.from(idx.table).select('id').eq(idx.column, 1).limit(1);
    const time = Date.now() - start;

    // Si la requête est rapide (<50ms), l'index existe probablement
    if (time < 50) {
      console.error(`✅ Index ${idx.name}: Probablement présent (${time}ms)`);
      indexCount++;
    } else {
      console.error(`⚠️ Index ${idx.name}: Peut-être manquant (${time}ms)`);
    }
  }
  results.indexes = indexCount >= 2;

  // Résumé
  console.error('\n' + '='.repeat(50));
  console.error('📈 RÉSUMÉ DES OPTIMISATIONS SUPABASE:\n');

  const optimizationScore = Object.values(results).filter(v => v).length;
  const totalOptimizations = Object.keys(results).length;
  const percentage = Math.round((optimizationScore / totalOptimizations) * 100);

  console.error(`Score: ${optimizationScore}/${totalOptimizations} (${percentage}%)`);

  if (percentage === 100) {
    console.error('\n✅ SUPABASE EST COMPLÈTEMENT OPTIMISÉ!');
  } else if (percentage >= 60) {
    console.error('\n⚠️ SUPABASE EST PARTIELLEMENT OPTIMISÉ');
    console.error('Manque: Vues SQL, Fonctions, et/ou Tables gamification');
  } else {
    console.error('\n❌ SUPABASE NÉCESSITE DES OPTIMISATIONS');
    console.error('Exécutez le SQL depuis optimizedQueries.ts dans Supabase Dashboard');
  }

  // Recommandations
  console.error('\n💡 POUR OPTIMISER COMPLÈTEMENT:');
  if (!results.views || !results.functions) {
    console.error('1. Allez dans Supabase Dashboard > SQL Editor');
    console.error('2. Copiez le SQL depuis src/services/optimizedQueries.ts (ligne 285+)');
    console.error('3. Exécutez le SQL');
  }
  if (!results.gamificationTables) {
    console.error('4. Créez les tables de gamification depuis schema.sql');
  }
}

checkOptimizations().catch(console.error);
