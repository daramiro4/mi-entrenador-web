# Revisión del emparejamiento de las fichas curadas

> GENERADO (`npm run gen:exercise-catalog`). **Solo informe: no cambia nada.** Decide el responsable.

Cada una de las 41 fichas curadas del módulo de fuerza apunta a una clave de Garmin. Para cada una: la clave asignada, 3 candidatas por parecido de nombre (en inglés, según la intención de la ficha) y material, y avisos.
**14 de 41 fichas tienen al menos un aviso.** El parecido es heurístico (Jaccard de palabras ± material): úsalo como pista, no como veredicto.

Para cambiar un emparejamiento hay que tocar `lib/strength/garmin-overrides.ts` (y, si la ficha cambia de clave, el seed del módulo de fuerza); este informe no lo hace.

## Bird dog `bird-dog` ⚠

- **Intención (EN):** Bird dog quadruped opposite arm and leg · **Material de la ficha:** bodyweight · **Patrón:** core
- **Clave asignada:** `HIP_STABILITY/QUADRUPED_WITH_LEG_LIFT` — «Quadruped with Leg Lift» (material por la clave: sin pista)
- ⚠ NOMBRE: «Quadruped with Leg Lift» se parece poco a lo que es la ficha («Bird dog quadruped opposite arm and leg», similitud 0.29).
- **Candidatas:**
  - `WARM_UP/OPPOSITE_ARM_AND_LEG_BALANCE` — «Opposite Arm and Leg Balance» · material: bodyweight · puntuación 0.53
  - `HYPEREXTENSION/BACK_EXTENSION_WITH_OPPOSITE_ARM_AND_LEG_REACH` — «Back Extension with Opposite Arm and Leg Reach» · material: unknown · puntuación 0.43
  - `HIP_STABILITY/WEIGHTED_QUADRUPED_WITH_LEG_LIFT` — «Weighted Quadruped with Leg Lift» · material: unknown · puntuación 0.40

## Buenos días con mancuerna `buenos-dias-mancuerna`

- **Intención (EN):** Dumbbell good morning · **Material de la ficha:** barbell, dumbbell · **Patrón:** hinge
- **Clave asignada:** `LEG_CURL/GOOD_MORNING` — «Good Morning» (material por la clave: sin pista)
- **Candidatas:**
  - `LEG_CURL/SEATED_BARBELL_GOOD_MORNING` — «Seated Barbell Good Morning» · material: barbell · puntuación 0.60
  - `LEG_CURL/SPLIT_BARBELL_GOOD_MORNING` — «Split Barbell Good Morning» · material: barbell · puntuación 0.60
  - `LEG_CURL/BAR_GOOD_MORNING` — «Bar Good Morning» · material: unknown · puntuación 0.55

## Curl de bíceps con mancuernas `curl-biceps`

- **Intención (EN):** Dumbbell biceps curl · **Material de la ficha:** band, dumbbell · **Patrón:** pull
- **Clave asignada:** `CURL/STANDING_DUMBBELL_BICEPS_CURL` — «Standing Dumbbell Biceps Curl» (material por la clave: dumbbell)
- **Candidatas:**
  - `CURL/DUMBBELL_BICEPS_CURL` — «Dumbbell Biceps Curl» · material: dumbbell · puntuación 1.20
  - `CURL/ALTERNATING_DUMBBELL_BICEPS_CURL` — «Alternating Dumbbell Biceps Curl» · material: dumbbell · puntuación 0.95
  - `CURL/INCLINE_DUMBBELL_BICEPS_CURL` — «Incline Dumbbell Biceps Curl» · material: dumbbell · puntuación 0.95

## Dead bug `dead-bug`

- **Intención (EN):** Dead bug · **Material de la ficha:** bodyweight · **Patrón:** core
- **Clave asignada:** `HIP_STABILITY/DEAD_BUG` — «Dead Bug» (material por la clave: sin pista)
- **Candidatas:**
  - `HIP_STABILITY/WEIGHTED_DEAD_BUG` — «Weighted Dead Bug» · material: unknown · puntuación 0.82
  - `SHOULDER_PRESS/DEAD_CURL_PRESS` — «Dead-curl Press» · material: unknown · puntuación 0.35
  - `CURL/DEAD_HANG_BICEPS_CURL` — «Dead-hang Biceps Curl» · material: unknown · puntuación 0.30

## Dominadas asistidas `dominadas-asistidas`

- **Intención (EN):** Assisted pull-up · **Material de la ficha:** band, machine · **Patrón:** pull
- **Clave asignada:** `PULL_UP/BAND_ASSISTED_PULL_UP` — «Band-assisted Pull-up» (material por la clave: band)
- **Candidatas:**
  - `PULL_UP/BAND_ASSISTED_CHIN_UP` — «Band-assisted Chin-up» · material: band · puntuación 0.60
  - `PULL_UP/PULL_UP` — «Pull-up» · material: pull_up_bar · puntuación 0.47
  - `PULL_UP/BANDED_PULL_UPS` — «Banded Pull-ups (Progression)» · material: band · puntuación 0.37

## Elevación de talones `elevacion-talones`

- **Intención (EN):** Standing calf raise · **Material de la ficha:** bodyweight, dumbbell · **Patrón:** squat
- **Clave asignada:** `CALF_RAISE/STANDING_CALF_RAISE` — «Standing Calf Raise» (material por la clave: sin pista)
- **Candidatas:**
  - `CALF_RAISE/STANDING_DUMBBELL_CALF_RAISE` — «Standing Dumbbell Calf Raise» · material: dumbbell · puntuación 0.95
  - `CALF_RAISE/WEIGHTED_STANDING_CALF_RAISE` — «Weighted Standing Calf Raise» · material: unknown · puntuación 0.90
  - `CALF_RAISE/CALF_RAISE` — «Calf Raise» · material: unknown · puntuación 0.82

## Estiramiento de pectoral en puerta `estiramiento-pectoral` ⚠

- **Intención (EN):** Doorway chest stretch · **Material de la ficha:** bodyweight · **Patrón:** mobility
- **Clave asignada:** `WARM_UP/STRETCH_PECTORAL` — «Pectoral Stretch» (material por la clave: sin pista)
- ⚠ NOMBRE: «Pectoral Stretch» se parece poco a lo que es la ficha («Doorway chest stretch», similitud 0.25).
- **Candidatas:**
  - `WARM_UP/STRETCH_LYING_KNEE_TO_CHEST` — «Lying Knee-to-Chest Stretch» · material: bodyweight · puntuación 0.55
  - `WARM_UP/STRETCH_WALL_CHEST_AND_SHOULDER` — «Wall Chest and Shoulder Stretch» · material: bodyweight · puntuación 0.55
  - `WARM_UP/BICEPS_STRETCH` — «Biceps Stretch» · material: bodyweight · puntuación 0.40

## Face pull con banda `face-pull-banda`

- **Intención (EN):** Band face pull · **Material de la ficha:** band, cable · **Patrón:** pull
- **Clave asignada:** `ROW/BANDED_FACE_PULLS` — «Banded Face Pulls» (material por la clave: band)
- **Candidatas:**
  - `ROW/FACE_PULL` — «Face Pull» · material: unknown · puntuación 0.72
  - `PULL_UP/BAND_ASSISTED_PULL_UP` — «Band-assisted Pull-up» · material: band, machine · puntuación 0.55
  - `ROW/FACE_PULL_WITH_EXTERNAL_ROTATION` — «Face Pull with External Rotation» · material: unknown · puntuación 0.45

## Flexiones `flexiones` ⚠

- **Intención (EN):** Push-up · **Material de la ficha:** bodyweight · **Patrón:** push
- **Clave asignada:** `PUSH_UP/PUSH_UP` — «Push-up» (material por la clave: sin pista)
- ⚠ GENÉRICA: la clave coincide con la categoría (Garmin muestra solo el nombre de la categoría).
- **Candidatas:**
  - `PUSH_UP/BICEPS_PUSH_UP` — «Biceps Push-up» · material: unknown · puntuación 0.82
  - `PUSH_UP/CLAPPING_PUSH_UP` — «Clapping Push-up» · material: unknown · puntuación 0.82
  - `PUSH_UP/DECLINE_PUSH_UP` — «Decline Push-up» · material: unknown · puntuación 0.82

## Flexiones inclinadas `flexiones-inclinadas`

- **Intención (EN):** Incline push-up · **Material de la ficha:** bodyweight · **Patrón:** push
- **Clave asignada:** `PUSH_UP/INCLINE_PUSH_UP` — «Incline Push-up» (material por la clave: sin pista)
- **Candidatas:**
  - `PUSH_UP/WEIGHTED_INCLINE_PUSH_UP` — «Weighted Incline Push-up» · material: unknown · puntuación 0.90
  - `PUSH_UP/PUSH_UP` — «Push-up» · material: bodyweight · puntuación 0.82
  - `PUSH_UP/BICEPS_PUSH_UP` — «Biceps Push-up» · material: unknown · puntuación 0.65

## Estiramiento de flexor de cadera `flexor-cadera`

- **Intención (EN):** Lunging hip flexor stretch · **Material de la ficha:** bodyweight · **Patrón:** mobility
- **Clave asignada:** `WARM_UP/STRETCH_LUNGING_HIP_FLEXOR` — «Lunging Hip Flexor Stretch» (material por la clave: sin pista)
- **Candidatas:**
  - `WARM_UP/STRETCH_HIP_FLEXOR_AND_QUAD` — «Hip Flexor and Quad Stretch» · material: bodyweight · puntuación 0.75
  - `WARM_UP/BICEPS_STRETCH` — «Biceps Stretch» · material: bodyweight · puntuación 0.35
  - `WARM_UP/GLUTES_STRETCH` — «Glutes Stretch» · material: bodyweight · puntuación 0.35

## Gato-camello `gato-camello`

- **Intención (EN):** Cat cow stretch · **Material de la ficha:** bodyweight · **Patrón:** mobility
- **Clave asignada:** `WARM_UP/STRETCH_CAT_COW` — «Cat Cow Stretch» (material por la clave: sin pista)
- **Candidatas:**
  - `WARM_UP/BICEPS_STRETCH` — «Biceps Stretch» · material: bodyweight · puntuación 0.40
  - `WARM_UP/CAT_CAMEL` — «Cat Camel» · material: bodyweight · puntuación 0.40
  - `WARM_UP/GLUTES_STRETCH` — «Glutes Stretch» · material: bodyweight · puntuación 0.40

## Hip thrust con mancuerna `hip-thrust` ⚠

- **Intención (EN):** Dumbbell hip thrust · **Material de la ficha:** barbell, bodyweight, dumbbell · **Patrón:** hinge
- **Clave asignada:** `HIP_RAISE/BARBELL_HIP_THRUST_WITH_BENCH` — «Barbell Hip Thrust with Bench» (material por la clave: barbell, bench)
- ⚠ NOMBRE: «Barbell Hip Thrust with Bench» se parece poco a lo que es la ficha («Dumbbell hip thrust», similitud 0.40).
- **Candidatas:**
  - `HIP_RAISE/BARBELL_HIP_THRUST_ON_FLOOR` — «Barbell Hip Thrust on Floor» · material: bodyweight · puntuación 0.60
  - `CHOP/DUMBBELL_CHOP` — «Dumbbell Chop» · material: dumbbell · puntuación 0.40
  - `DEADLIFT/DUMBBELL_DEADLIFT` — «Dumbbell Deadlift» · material: dumbbell · puntuación 0.40

## Jalón al pecho `jalon-pecho` ⚠

- **Intención (EN):** Lat pulldown · **Material de la ficha:** cable, machine · **Patrón:** pull
- **Clave asignada:** `PULL_UP/LAT_PULLDOWN` — «Lat Pull-down» (material por la clave: sin pista)
- ⚠ NOMBRE: «Lat Pull-down» se parece poco a lo que es la ficha («Lat pulldown», similitud 0.25).
- **Candidatas:**
  - `WARM_UP/STRETCH_LAT` — «Lat Stretch» · material: bodyweight · puntuación 0.33
  - `PULL_UP/KNEELING_LAT_PULLDOWN` — «Kneeling Lat Pull-down» · material: unknown · puntuación 0.25
  - `PULL_UP/_30_DEGREE_LAT_PULLDOWN` — «30-degree Lat Pull-down» · material: unknown · puntuación 0.22

## Press Pallof `pallof` ⚠

- **Intención (EN):** Pallof press · **Material de la ficha:** band, cable · **Patrón:** core
- **Clave asignada:** `CORE/CABLE_CORE_PRESS` — «Cable Core Press» (material por la clave: cable)
- ⚠ NOMBRE: «Cable Core Press» se parece poco a lo que es la ficha («Pallof press», similitud 0.25).
- **Candidatas:**
  - `BANDED_EXERCISES/SQUAT_TO_PRESS` — «Banded Squat to Press» · material: band · puntuación 0.40
  - `PUSH_UP/CHEST_PRESS_WITH_BAND` — «Chest Press with Band» · material: band · puntuación 0.40
  - `CRUNCH/FROG_PRESS` — «Frog Press» · material: unknown · puntuación 0.33

## Paseo del granjero `paseo-granjero`

- **Intención (EN):** Farmer's carry · **Material de la ficha:** dumbbell, kettlebell · **Patrón:** carry
- **Clave asignada:** `CARRY/FARMERS_CARRY` — «Farmer's Carry» (material por la clave: sin pista)
- **Candidatas:**
  - `CARRY/FARMERS_CARRY_ON_TOES` — «Farmer's Carry on Toes» · material: unknown · puntuación 0.80
  - `CARRY/FARMERS_CARRY_WALK_LUNGE` — «Farmer's Carry Walk Lunge» · material: unknown · puntuación 0.65
  - `CARRY/FARMERS_WALK` — «Farmer's Walk» · material: unknown · puntuación 0.55

## Peso muerto con barra `peso-muerto-barra`

- **Intención (EN):** Barbell deadlift · **Material de la ficha:** barbell · **Patrón:** hinge
- **Clave asignada:** `DEADLIFT/BARBELL_DEADLIFT` — «Barbell Deadlift» (material por la clave: barbell)
- **Candidatas:**
  - `DEADLIFT/BARBELL_DEFICIT_DEADLIFT` — «Barbell Deficit Deadlift» · material: barbell · puntuación 0.87
  - `DEADLIFT/BARBELL_STRAIGHT_LEG_DEADLIFT` — «Barbell Straight-leg Deadlift» · material: barbell · puntuación 0.70
  - `DEADLIFT/SINGLE_LEG_BARBELL_DEADLIFT` — «Single-leg Barbell Deadlift» · material: barbell · puntuación 0.70

## Peso muerto con kettlebell `peso-muerto-kettlebell`

- **Intención (EN):** Kettlebell deadlift · **Material de la ficha:** dumbbell, kettlebell · **Patrón:** hinge
- **Clave asignada:** `DEADLIFT/KETTLEBELL_DEADLIFT` — «Kettlebell Deadlift» (material por la clave: kettlebell)
- **Candidatas:**
  - `DEADLIFT/KETTLEBELL_SUMO_DEADLIFT` — «Kettlebell Sumo Deadlift» · material: kettlebell · puntuación 0.87
  - `DEADLIFT/DEADLIFT` — «Deadlift» · material: unknown · puntuación 0.55
  - `DEADLIFT/DUMBBELL_DEADLIFT` — «Dumbbell Deadlift» · material: dumbbell · puntuación 0.53

## Peso muerto rumano con mancuernas `peso-muerto-rumano`

- **Intención (EN):** Dumbbell romanian deadlift · **Material de la ficha:** barbell, dumbbell · **Patrón:** hinge
- **Clave asignada:** `DEADLIFT/ROMANIAN_DEADLIFT` — «Romanian Deadlift» (material por la clave: sin pista)
- **Candidatas:**
  - `DEADLIFT/DUMBBELL_DEADLIFT` — «Dumbbell Deadlift» · material: dumbbell · puntuación 0.87
  - `DEADLIFT/SINGLE_LEG_ROMANIAN_DEADLIFT_WITH_DUMBBELL` — «Single-leg Romanian Deadlift with Dumbbell» · material: bodyweight, dumbbell · puntuación 0.80
  - `DEADLIFT/DUMBBELL_STRAIGHT_LEG_DEADLIFT` — «Dumbbell Straight-leg Deadlift» · material: dumbbell · puntuación 0.60

## Peso muerto a una pierna `peso-muerto-una-pierna`

- **Intención (EN):** Single-leg romanian deadlift with dumbbell · **Material de la ficha:** bodyweight, dumbbell · **Patrón:** hinge
- **Clave asignada:** `DEADLIFT/SINGLE_LEG_ROMANIAN_DEADLIFT_WITH_DUMBBELL` — «Single-leg Romanian Deadlift with Dumbbell» (material por la clave: dumbbell)
- **Candidatas:**
  - `DEADLIFT/DUMBBELL_SINGLE_LEG_DEADLIFT_TO_ROW` — «Dumbbell Single-leg Deadlift to Row» · material: dumbbell · puntuación 0.87
  - `DEADLIFT/SINGLE_LEG_ROMANIAN_DEADLIFT_CIRCUIT` — «Single-leg Romanian Deadlift Circuit» · material: unknown · puntuación 0.82
  - `DEADLIFT/DUMBBELL_STRAIGHT_LEG_DEADLIFT` — «Dumbbell Straight-leg Deadlift» · material: dumbbell · puntuación 0.70

## Plancha `plancha` ⚠

- **Intención (EN):** Plank · **Material de la ficha:** bodyweight · **Patrón:** core
- **Clave asignada:** `PLANK/PLANK` — «Plank» (material por la clave: sin pista)
- ⚠ GENÉRICA: la clave coincide con la categoría (Garmin muestra solo el nombre de la categoría).
- **Candidatas:**
  - `PLANK/EXTENDED_PLANK` — «Extended Plank» · material: unknown · puntuación 0.65
  - `PLANK/KNEELING_PLANK` — «Kneeling Plank» · material: unknown · puntuación 0.65
  - `PLANK/PLANK_PIKES` — «Plank Pikes» · material: unknown · puntuación 0.65

## Prensa de piernas `prensa-piernas`

- **Intención (EN):** Leg press · **Material de la ficha:** machine · **Patrón:** squat
- **Clave asignada:** `SQUAT/LEG_PRESS` — «Leg Press» (material por la clave: sin pista)
- **Candidatas:**
  - `BENCH_PRESS/SMITH_MACHINE_BENCH_PRESS` — «Smith Machine Bench Press» · material: bench, machine · puntuación 0.35
  - `SHOULDER_PRESS/SMITH_MACHINE_OVERHEAD_PRESS` — «Smith Machine Overhead Press» · material: machine · puntuación 0.35
  - `CRUNCH/FROG_PRESS` — «Frog Press» · material: unknown · puntuación 0.33

## Press de pecho con banda `press-banda-pecho`

- **Intención (EN):** Band chest press · **Material de la ficha:** band · **Patrón:** push
- **Clave asignada:** `PUSH_UP/CHEST_PRESS_WITH_BAND` — «Chest Press with Band» (material por la clave: band)
- **Candidatas:**
  - `SQUAT/SQUATS_WITH_BAND` — «Squats with Band» · material: band · puntuación 0.40
  - `BANDED_EXERCISES/SQUAT_TO_PRESS` — «Banded Squat to Press» · material: band · puntuación 0.35
  - `LEG_CURL/BAND_GOOD_MORNING` — «Band Good Morning» · material: band · puntuación 0.35

## Press de hombro con mancuernas `press-hombro-mancuernas`

- **Intención (EN):** Dumbbell shoulder press · **Material de la ficha:** dumbbell · **Patrón:** push
- **Clave asignada:** `SHOULDER_PRESS/DUMBBELL_SHOULDER_PRESS` — «Dumbbell Shoulder Press» (material por la clave: dumbbell)
- **Candidatas:**
  - `SHOULDER_PRESS/ALTERNATING_DUMBBELL_SHOULDER_PRESS` — «Alternating Dumbbell Shoulder Press» · material: dumbbell · puntuación 0.95
  - `SHOULDER_PRESS/SEATED_DUMBBELL_SHOULDER_PRESS` — «Seated Dumbbell Shoulder Press» · material: dumbbell · puntuación 0.95
  - `SHOULDER_PRESS/DUMBBELL_ALTERNATING_SHOULDER_PRESS_AND_TWIST` — «Dumbbell Alternating Shoulder Press and Twist» · material: dumbbell · puntuación 0.80

## Press de pecho con mancuernas `press-mancuernas`

- **Intención (EN):** Dumbbell bench press · **Material de la ficha:** dumbbell · **Patrón:** push
- **Clave asignada:** `BENCH_PRESS/DUMBBELL_BENCH_PRESS` — «Dumbbell Bench Press» (material por la clave: bench, dumbbell)
- **Candidatas:**
  - `BENCH_PRESS/DECLINE_DUMBBELL_BENCH_PRESS` — «Decline Dumbbell Bench Press» · material: bench, dumbbell · puntuación 0.95
  - `BENCH_PRESS/INCLINE_DUMBBELL_BENCH_PRESS` — «Incline Dumbbell Bench Press» · material: bench, dumbbell · puntuación 0.95
  - `BENCH_PRESS/NEUTRAL_GRIP_DUMBBELL_BENCH_PRESS` — «Neutral-grip Dumbbell Bench Press» · material: bench, dumbbell · puntuación 0.80

## Puente de glúteo `puente-gluteo` ⚠

- **Intención (EN):** Glute bridge bodyweight · **Material de la ficha:** bodyweight · **Patrón:** hinge
- **Clave asignada:** `HIP_RAISE/BARBELL_HIP_THRUST_ON_FLOOR` — «Barbell Hip Thrust on Floor» (material por la clave: barbell)
- ⚠ MATERIAL: la clave implica «barbell» y la ficha dice «bodyweight».
- ⚠ NOMBRE: «Barbell Hip Thrust on Floor» se parece poco a lo que es la ficha («Glute bridge bodyweight», similitud 0.00).
- **Candidatas:**
  - `HIP_RAISE/CLAM_BRIDGE` — «Clam Bridge» · material: unknown · puntuación 0.40
  - `HIP_RAISE/BRIDGE_WITH_LEG_EXTENSION` — «Bridge with Leg Extension» · material: unknown · puntuación 0.35
  - `HIP_RAISE/WEIGHTED_CLAM_BRIDGE` — «Weighted Clam Bridge» · material: unknown · puntuación 0.35

## Puente de glúteo a una pierna `puente-gluteo-una-pierna` ⚠

- **Intención (EN):** Single-leg glute bridge · **Material de la ficha:** bodyweight · **Patrón:** hinge
- **Clave asignada:** `HIP_RAISE/SINGLE_LEG_HIP_RAISE` — «Single-leg Hip Raise» (material por la clave: sin pista)
- ⚠ NOMBRE: «Single-leg Hip Raise» se parece poco a lo que es la ficha («Single-leg glute bridge», similitud 0.33).
- **Candidatas:**
  - `HIP_RAISE/BRIDGE_WITH_LEG_EXTENSION` — «Bridge with Leg Extension» · material: unknown · puntuación 0.55
  - `TRICEPS_EXTENSION/SINGLE_LEG_DIP` — «Single-leg Dip» · material: unknown · puntuación 0.50
  - `HIP_RAISE/WEIGHTED_BRIDGE_WITH_LEG_EXTENSION` — «Weighted Bridge with Leg Extension» · material: unknown · puntuación 0.48

## Remo con banda `remo-banda` ⚠

- **Intención (EN):** Band row · **Material de la ficha:** band · **Patrón:** pull
- **Clave asignada:** `BANDED_EXERCISES/ROW` — «Banded Row» (material por la clave: band)
- ⚠ NOMBRE: «Banded Row» se parece poco a lo que es la ficha («Band row», similitud 0.33).
- **Candidatas:**
  - `HYPEREXTENSION/ONE_ARM_ROW_WITH_BAND` — «One-arm Row with Band» · material: band · puntuación 0.65
  - `ROW/ROW` — «Row» · material: unknown · puntuación 0.50
  - `SQUAT/SQUATS_WITH_BAND` — «Squats with Band» · material: band · puntuación 0.48

## Remo invertido bajo una mesa `remo-invertido`

- **Intención (EN):** Inverted row · **Material de la ficha:** bodyweight · **Patrón:** pull
- **Clave asignada:** `ROW/INVERTED_ROW` — «Inverted Row» (material por la clave: sin pista)
- **Candidatas:**
  - `ROW/MODIFIED_INVERTED_ROW` — «Modified Inverted Row» · material: unknown · puntuación 0.82
  - `ROW/SUSPENDED_INVERTED_ROW` — «Suspended Inverted Row» · material: unknown · puntuación 0.82
  - `ROW/WEIGHTED_INVERTED_ROW` — «Weighted Inverted Row» · material: unknown · puntuación 0.82

## Remo con mancuerna `remo-mancuerna`

- **Intención (EN):** Dumbbell row · **Material de la ficha:** dumbbell · **Patrón:** pull
- **Clave asignada:** `ROW/DUMBBELL_ROW` — «Dumbbell Row» (material por la clave: dumbbell)
- **Candidatas:**
  - `ROW/ALTERNATING_DUMBBELL_ROW` — «Alternating Dumbbell Row» · material: dumbbell · puntuación 0.87
  - `ROW/SEATED_DUMBBELL_ROW` — «Seated Dumbbell Row» · material: dumbbell · puntuación 0.87
  - `SHRUG/DUMBBELL_UPRIGHT_ROW` — «Dumbbell Upright Row» · material: dumbbell · puntuación 0.82

## Retracción cervical (cuello) `retraccion-cervical` ⚠

- **Intención (EN):** Neck retraction chin tuck · **Material de la ficha:** bodyweight · **Patrón:** mobility
- **Clave asignada:** `WARM_UP/STRETCH_NECK` — «Neck Stretch» (material por la clave: sin pista)
- ⚠ NOMBRE: «Neck Stretch» se parece poco a lo que es la ficha («Neck retraction chin tuck», similitud 0.20).
- **Candidatas:**
  - `WARM_UP/NECK_ROTATIONS` — «Neck Rotations» · material: bodyweight · puntuación 0.35
  - `WARM_UP/NECK_TILTS` — «Neck Tilts» · material: bodyweight · puntuación 0.35
  - `SHRUG/SCAPULAR_RETRACTION` — «Scapular Retraction» · material: unknown · puntuación 0.30

## Rotación torácica `rotacion-toracica`

- **Intención (EN):** Thoracic rotation quadruped · **Material de la ficha:** bodyweight · **Patrón:** mobility
- **Clave asignada:** `WARM_UP/THORACIC_ROTATION` — «Thoracic Rotation» (material por la clave: sin pista)
- **Candidatas:**
  - `HIP_STABILITY/QUADRUPED` — «Quadruped» · material: unknown · puntuación 0.43
  - `WARM_UP/NECK_ROTATIONS` — «Neck Rotations» · material: bodyweight · puntuación 0.40
  - `WARM_UP/QUADRUPED_ROCKING` — «Quadruped Rocking» · material: bodyweight · puntuación 0.40

## Sentadilla búlgara `sentadilla-bulgara`

- **Intención (EN):** Dumbbell bulgarian split squat · **Material de la ficha:** bodyweight, dumbbell · **Patrón:** squat
- **Clave asignada:** `LUNGE/DUMBBELL_BULGARIAN_SPLIT_SQUAT` — «Dumbbell Bulgarian Split Squat» (material por la clave: dumbbell)
- **Candidatas:**
  - `LUNGE/DUMBBELL_OVERHEAD_BULGARIAN_SPLIT_SQUAT` — «Dumbbell Overhead Bulgarian Split Squat» · material: dumbbell · puntuación 1.00
  - `SQUAT/DUMBBELL_SPLIT_SQUAT` — «Dumbbell Split Squat» · material: dumbbell · puntuación 0.90
  - `LUNGE/OVERHEAD_DUMBBELL_SPLIT_SQUAT` — «Overhead Dumbbell Split Squat» · material: dumbbell · puntuación 0.80

## Sentadilla a la caja `sentadilla-caja` ⚠

- **Intención (EN):** Box squat · **Material de la ficha:** bodyweight, dumbbell · **Patrón:** squat
- **Clave asignada:** `SQUAT/SQUAT` — «Squat» (material por la clave: sin pista)
- ⚠ GENÉRICA: la clave coincide con la categoría (Garmin muestra solo el nombre de la categoría).
- **Candidatas:**
  - `SQUAT/DUMBBELL_SQUAT` — «Dumbbell Squat» · material: dumbbell · puntuación 0.53
  - `SQUAT/AIR_SQUAT` — «Air Squat» · material: bodyweight · puntuación 0.48
  - `SQUAT/BACK_SQUATS` — «Back Squats» · material: unknown · puntuación 0.48

## Sentadilla goblet `sentadilla-goblet`

- **Intención (EN):** Goblet squat · **Material de la ficha:** dumbbell, kettlebell · **Patrón:** squat
- **Clave asignada:** `SQUAT/GOBLET_SQUAT` — «Goblet Squat» (material por la clave: sin pista)
- **Candidatas:**
  - `SQUAT/SQUAT` — «Squat» · material: bodyweight, dumbbell · puntuación 0.55
  - `SQUAT/WIDE_STANCE_GOBLET_SQUAT` — «Wide-stance Goblet Squat» · material: unknown · puntuación 0.55
  - `SQUAT/DUMBBELL_SQUAT` — «Dumbbell Squat» · material: dumbbell · puntuación 0.53

## Sentadilla isométrica en la pared `sentadilla-isometrica-pared` ⚠

- **Intención (EN):** Wall sit squat · **Material de la ficha:** bodyweight · **Patrón:** squat
- **Clave asignada:** `SQUAT/BODY_WEIGHT_WALL_SQUAT` — «Body-weight Wall Squat» (material por la clave: bodyweight)
- ⚠ NOMBRE: «Body-weight Wall Squat» se parece poco a lo que es la ficha («Wall sit squat», similitud 0.40).
- **Candidatas:**
  - `SQUAT/WEIGHTED_WALL_SQUAT` — «Weighted Wall Squat» · material: unknown · puntuación 0.65
  - `SQUAT/WALL_BALL_SQUAT_AND_PRESS` — «Wall Ball Squat and Press» · material: unknown · puntuación 0.55
  - `SQUAT/SWISS_BALL_BODY_WEIGHT_WALL_SQUAT` — «Swiss Ball Body-weight Wall Squat» · material: bodyweight, stability_ball · puntuación 0.49

## Sentadilla con peso corporal `sentadilla-peso-corporal` ⚠

- **Intención (EN):** Bodyweight squat · **Material de la ficha:** bodyweight · **Patrón:** squat
- **Clave asignada:** `SQUAT/AIR_SQUAT` — «Air Squat» (material por la clave: sin pista)
- ⚠ NOMBRE: «Air Squat» se parece poco a lo que es la ficha («Bodyweight squat», similitud 0.33).
- **Candidatas:**
  - `SQUAT/SQUAT` — «Squat» · material: bodyweight, dumbbell · puntuación 0.65
  - `SQUAT/BACK_SQUATS` — «Back Squats» · material: unknown · puntuación 0.48
  - `SQUAT/BALANCING_SQUAT` — «Balancing Squat» · material: unknown · puntuación 0.48

## Subida al cajón `subida-cajon`

- **Intención (EN):** Step-up on box · **Material de la ficha:** bodyweight, dumbbell · **Patrón:** squat
- **Clave asignada:** `SQUAT/STEP_UP` — «Step-up» (material por la clave: sin pista)
- **Candidatas:**
  - `SQUAT/DUMBBELL_STEP_UP` — «Dumbbell Step-up» · material: dumbbell · puntuación 0.70
  - `SQUAT/WEIGHTED_STEP_UP` — «Weighted Step-up» · material: unknown · puntuación 0.65
  - `SQUAT/CROSSOVER_DUMBBELL_STEP_UP` — «Crossover Dumbbell Step-up» · material: dumbbell · puntuación 0.60

## Superman `superman`

- **Intención (EN):** Superman back extension on floor · **Material de la ficha:** bodyweight · **Patrón:** core
- **Clave asignada:** `HYPEREXTENSION/SUPERMAN_FROM_FLOOR` — «Superman from Floor» (material por la clave: sin pista)
- **Candidatas:**
  - `HYPEREXTENSION/STATIC_BACK_EXTENSION` — «Static Back Extension» · material: unknown · puntuación 0.55
  - `HYPEREXTENSION/WEIGHTED_SUPERMAN_FROM_FLOOR` — «Weighted Superman from Floor» · material: unknown · puntuación 0.55
  - `CORE/GHD_BACK_EXTENSIONS` — «GHD Back Extensions» · material: unknown · puntuación 0.50

## Zancada `zancada`

- **Intención (EN):** Lunge · **Material de la ficha:** bodyweight, dumbbell · **Patrón:** squat
- **Clave asignada:** `LUNGE/DUMBBELL_LUNGE` — «Dumbbell Lunge» (material por la clave: dumbbell)
- **Candidatas:**
  - `LUNGE/LUNGE` — «Lunge» · material: unknown · puntuación 1.15
  - `LUNGE/CURTSY_LUNGE` — «Curtsy Lunge» · material: unknown · puntuación 0.65
  - `LUNGE/DIAGONAL_LUNGE` — «Diagonal Lunge» · material: unknown · puntuación 0.65

## Zancada hacia atrás `zancada-atras`

- **Intención (EN):** Reverse lunge · **Material de la ficha:** bodyweight, dumbbell · **Patrón:** squat
- **Clave asignada:** `LUNGE/DUMBBELL_REVERSE_LUNGE` — «Dumbbell Reverse Lunge» (material por la clave: dumbbell)
- **Candidatas:**
  - `LUNGE/REVERSE_SLIDING_LUNGE` — «Reverse Sliding Lunge» · material: unknown · puntuación 0.82
  - `LUNGE/OFFSET_DUMBBELL_REVERSE_LUNGE` — «Offset Dumbbell Reverse Lunge» · material: dumbbell · puntuación 0.70
  - `LUNGE/OVERHEAD_DUMBBELL_REVERSE_LUNGE` — «Overhead Dumbbell Reverse Lunge» · material: dumbbell · puntuación 0.70
