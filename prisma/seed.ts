import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const exercises = [
  // Chest
  { name: 'Bench Press', bodyPart: 'chest' },
  { name: 'Incline Bench Press', bodyPart: 'chest' },
  { name: 'Decline Bench Press', bodyPart: 'chest' },
  { name: 'Dumbbell Press', bodyPart: 'chest' },
  { name: 'Incline Dumbbell Press', bodyPart: 'chest' },
  { name: 'Chest Fly', bodyPart: 'chest' },
  { name: 'Cable Crossover', bodyPart: 'chest' },
  { name: 'Push-ups', bodyPart: 'chest' },
  { name: 'Dips (Chest)', bodyPart: 'chest' },

  // Arms
  { name: 'Barbell Curl', bodyPart: 'arms' },
  { name: 'Dumbbell Curl', bodyPart: 'arms' },
  { name: 'Hammer Curl', bodyPart: 'arms' },
  { name: 'Preacher Curl', bodyPart: 'arms' },
  { name: 'Cable Curl', bodyPart: 'arms' },
  { name: 'Tricep Pushdown', bodyPart: 'arms' },
  { name: 'Overhead Tricep Extension', bodyPart: 'arms' },
  { name: 'Skull Crushers', bodyPart: 'arms' },
  { name: 'Dips (Triceps)', bodyPart: 'arms' },
  { name: 'Close-Grip Bench Press', bodyPart: 'arms' },

  // Shoulders
  { name: 'Overhead Press', bodyPart: 'shoulders' },
  { name: 'Dumbbell Shoulder Press', bodyPart: 'shoulders' },
  { name: 'Lateral Raise', bodyPart: 'shoulders' },
  { name: 'Front Raise', bodyPart: 'shoulders' },
  { name: 'Rear Delt Fly', bodyPart: 'shoulders' },
  { name: 'Arnold Press', bodyPart: 'shoulders' },
  { name: 'Upright Row', bodyPart: 'shoulders' },
  { name: 'Shrugs', bodyPart: 'shoulders' },

  // Back
  { name: 'Deadlift', bodyPart: 'back' },
  { name: 'Pull-ups', bodyPart: 'back' },
  { name: 'Chin-ups', bodyPart: 'back' },
  { name: 'Bent-Over Row', bodyPart: 'back' },
  { name: 'T-Bar Row', bodyPart: 'back' },
  { name: 'Seated Cable Row', bodyPart: 'back' },
  { name: 'Single-Arm Dumbbell Row', bodyPart: 'back' },
  { name: 'Lat Pulldown', bodyPart: 'back' },
  { name: 'Face Pulls', bodyPart: 'back' },

  // Legs
  { name: 'Squat', bodyPart: 'legs' },
  { name: 'Front Squat', bodyPart: 'legs' },
  { name: 'Romanian Deadlift', bodyPart: 'legs' },
  { name: 'Leg Press', bodyPart: 'legs' },
  { name: 'Leg Extension', bodyPart: 'legs' },
  { name: 'Leg Curl', bodyPart: 'legs' },
  { name: 'Lunge', bodyPart: 'legs' },
  { name: 'Bulgarian Split Squat', bodyPart: 'legs' },
  { name: 'Calf Raise', bodyPart: 'legs' },
  { name: 'Hip Thrust', bodyPart: 'legs' },

  // Abs
  { name: 'Plank', bodyPart: 'abs' },
  { name: 'Crunches', bodyPart: 'abs' },
  { name: 'Leg Raises', bodyPart: 'abs' },
  { name: 'Russian Twists', bodyPart: 'abs' },
  { name: 'Cable Crunch', bodyPart: 'abs' },
  { name: 'Ab Wheel Rollout', bodyPart: 'abs' },
  { name: 'Hanging Knee Raises', bodyPart: 'abs' },
  { name: 'Side Plank', bodyPart: 'abs' },
]

async function main() {
  console.log('Start seeding...')

  // Clear existing exercises
  await prisma.exercise.deleteMany({})

  // Create exercises
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: exercise,
    })
  }

  console.log(`Seeded ${exercises.length} exercises`)
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
