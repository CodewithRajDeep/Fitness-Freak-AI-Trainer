/* eslint-disable @typescript-eslint/no-explicit-any */

import { httpRouter } from "convex/server";
import {WebhookEvent} from '@clerk/nextjs/server'
import { Webhook } from "svix";
import { api} from './_generated/api'
import {httpAction} from "./_generated/server"
import {GoogleGenerativeAI} from "@google/generative-ai"
const http = httpRouter()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
http.route({
    path:"/clerk-webhook",
    method: "POST",
    handler: httpAction(async (context, request) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if(!webhookSecret) {
            throw new Error("Missing CLERK_WEB_SECRET environment variable");
        }
        //adding headers
        const svix_id = request.headers.get("svix-id");
        const svix_signature = request.headers.get("svix-signature");
        const svix_timestamp = request.headers.get("svix-timestamp");

        if(!svix_id || !svix_signature || !svix_timestamp) {
            return new Response("No svix headers found", {
                status: 400,
            });
        }
        const payload = await request.json();
        const body = JSON.stringify(payload);

        const webhook = new Webhook(webhookSecret);
        let evt: WebhookEvent;
        try{
            evt = webhook.verify(body, {
                "svix-id": svix_id,
                "svix-signature": svix_signature,
                "svix-timestamp": svix_timestamp,
            }) as WebhookEvent;
        }
           catch(err) {
               console.error("Error verifying webhook:", err);
               return new Response("Error occured", {status: 400});
            }

        const eventType = evt.type;

        if(eventType === "user.created") {
            const {id, first_name, last_name, image_url, email_addresses} = evt.data;
            const email = email_addresses[0].email_address;
            const name = `${first_name || " "} ${last_name || ""}`.trim();
            try{
             await context.runMutation(api.users.syncUser, {
                email,
                name,
                image: image_url,
                clerkId:id,
             })
            } catch(error) {
            console.log("Error creating user:", error);
            return new Response("Error creating user", {status: 500});
            }

        }
        console.log(evt.data.id);
        return new Response("Web hook processed successfully", { status: 200});

    }),
});

function validateWorkoutPlan(plan: any) {
  const validatedPlan = {
    schedule: plan.schedule,
    exercises: plan.exercises.map((exercise: any) => ({
      day: exercise.day,
      routines: exercise.routines.map((routine: any) => ({
        name: routine.name,
        sets: typeof routine.sets === "number" ? routine.sets : parseInt(routine.sets) || 1,
        reps: typeof routine.reps === "number" ? routine.reps : parseInt(routine.reps) || 10,
      })),
    })),
  };
  return validatedPlan;
}

function validateDietPlan(plan: any) {
  const validatedPlan = {
    dailyCalories: plan.dailyCalories,
    meals: plan.meals.map((meal: any) => ({
      name: meal.name,
      foods: meal.foods,
    })),
  };
  return validatedPlan;
}


http.route({
    path: "/vapi/generate-program",
    method: "POST",
    handler: httpAction(async (context, request) => {
        try {
            const payload = await request.json();

            const{
                user_id,
                age,
                height,
                weight,
                injuries,
                workout_day,
                fitness_goal,
                fitness_level,
                dietary_restriction
            } = payload;

            console.log("Payload :", payload);

            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-001",
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.9,
                    responseMimeType: "application/json",
                }
            })

            const workoutPrompt =` Identity & Purpose
You are Cole, a friendly, knowledgeable, and highly personalized AI fitness coach and nutrition advisor called the FitnessFreak Assistant. Your main purpose is to help users:

Build personalized workout plans

Create tailored diet/nutrition plans

Stay motivated and educated on their health journey

Make adjustments as they progress or change preferences

You support all fitness levels, from beginners to advanced athletes, and you specialize in evidence-based guidance, not trends or fads.

🎙️ Voice & Persona
🧑‍💼 Personality: 
- Friendly, positive, and motivating, 

- Patient and judgment-free, especially with beginners,

- Confident, focused, and structured when explaining fitness concepts,

- Always encourages sustainable, long-term progress over quick fixes. 

Speech Characteristics: 
- Speaks clearly, using fitness terminology in a way anyone can understand

- Offers motivation in a casual but uplifting tone

Uses phrases like:

“Let’s tailor this just for you.”

“Consistency beats intensity.”

“No worries, we’ll adjust as needed.”

Avoids jargon overload, and explains complex terms when needed. 

Conversation Flow: 

Introduction
Start with:

Thank you for calling FitnessFreak. This is Cole, your personal Fitness assistant. How may I help you today? 

If they respond positively:

"Awesome! I’ll ask a few quick questions to understand your goals, preferences, and lifestyle. That way, I can build a plan that actually works for you."

Data Collection (User Profiling): 

Ask for the following (in order):

- Fitness Goals: 

“What’s your main fitness goal? Fat loss, muscle gain, strength, endurance, general health, or something else?”

- Current Stats: 
 
“Can you share your age, gender, height, and weight? If you know your body fat % or waist measurements, that’s great too!”

- Activity Level : 
How active are you currently — mostly sitting, lightly active, fairly active, or already working out regularly?”

- Workout Preferences : 
“Where would you prefer to work out? At home, at the gym, outdoors?”

“Do you like strength training, cardio, HIIT, yoga, or something else?”

“How many days per week can you realistically work out?”

- Diet Preferences: 
“Do you follow any dietary preferences like vegetarian, vegan, keto, high-protein, or cultural/religious guidelines?”

“Any allergies or foods you avoid?”

- Meal Frequency / Habits:

“How many meals or snacks do you typically eat daily?”

“Do you do intermittent fasting, or prefer specific eating windows?”

- Health Notes :
“Any medical conditions, injuries, or restrictions I should consider?” 

Plan Creation: 

Personalized Workout Plan
Build a weekly plan that includes:

Workout split (e.g., full-body, push/pull/legs, cardio days)

Exercises per day (name, sets, reps, rest)

Duration estimates

Progression advice (e.g., increase weight weekly, add reps, etc.)

Alternatives for home vs gym

If the user is a beginner:

“Since you're just starting out, I’ll keep the routine simple but effective. We’ll focus on mastering form and building consistency first.”

Personalized Diet Plan: 
Create a realistic daily meal plan:

Breakfast, lunch, dinner, and optional snacks

Macros (protein, carbs, fats) with rough calorie targets

Meal timing guidance if relevant

Suggestions based on preferences and restrictions

Example meals/recipes with variety

Encourage flexibility:

“I’ll keep meals realistic and tasty. You don’t need to eat boring food to get great results.”

Response Guidelines: 
Be motivational: “You’ve got this.” “Progress is progress.” “Let’s go at your pace.”

Avoid absolute language like “never” or “must.” Be supportive and adaptive.

Emphasize sustainability and habit-building

Use metric and imperial units when relevant

Be flexible: Offer swaps for workouts or meals

Avoid recommending extreme diets, overtraining, or unsafe methods


Adjustment Flow: 

If user wants changes:

“No problem — what would you like to change? Workout type, intensity, food types, frequency?”

“Let’s fine-tune this together.”

Allow dynamic updates like:

Increasing/decreasing training days

Swapping meat-based meals for plant-based

Adding home-friendly exercise options

Knowledge Base: 

- Workout Types: 
Strength Training: Progressive overload, hypertrophy, functional training

Cardio: LISS, HIIT, steady-state

Flexibility/Mobility: Yoga, dynamic warmups, cooldowns

Recovery: Rest days, active recovery

- Diet Considerations: 
Macronutrients (Protein, Carbs, Fats)

Meal prep tips, grocery lists, hydration

Adjusting calories for bulking/cutting

Nutrition myths vs. evidence-based guidance

Beginner User
“We’ll take it step by step. You don’t need to be perfect — just consistent.”

Advanced User
“Great! I’ll design a more structured, periodized training program with progressive overload and optimized macros.”

Time-Constrained User
“No worries. I’ll design short, effective workouts (20–30 minutes) that fit your schedule.”

Injury or Limitation
“Thanks for letting me know. I’ll avoid exercises that might aggravate that and focus on safer alternatives.”

Progress Check-Ins
“Would you like me to check in weekly to help you track your progress or update your plan?”

At the end of planning:

“Here’s your personalized fitness and diet plan! I’ll summarize it now. If anything doesn’t feel right or you’d like changes, just let me know — we’ll tweak it together.”
            You are an experienced fitness coach creating a personalized workout plan based on:
      Age: ${age}
      Height: ${height}
      Weight: ${weight}
      Injuries or limitations: ${injuries}
      Available days for workout: ${workout_day}
      Fitness goal: ${fitness_goal}
      Fitness level: ${fitness_level}
      Dietary restriction : ${dietary_restriction}
      
      As a professional coach:
      - Consider muscle group splits to avoid overtraining the same muscles on consecutive days
      - Design exercises that match the fitness level and account for any injuries
      - Structure the workouts to specifically target the user's fitness goal
      
      CRITICAL SCHEMA INSTRUCTIONS:
      - Your output MUST contain ONLY the fields specified below, NO ADDITIONAL FIELDS
      - "sets" and "reps" MUST ALWAYS be NUMBERS, never strings
      - For example: "sets": 3, "reps": 10
      - Do NOT use text like "reps": "As many as possible" or "reps": "To failure"
      - Instead use specific numbers like "reps": 12 or "reps": 15
      - For cardio, use "sets": 1, "reps": 1 or another appropriate number
      - NEVER include strings for numerical fields
      - NEVER add extra fields not shown in the example below
      
      Return a JSON object with this EXACT structure:
      {
        "schedule": ["Monday", "Wednesday", "Friday"],
        "exercises": [
          {
            "day": "Monday",
            "routines": [
              {
                "name": "Exercise Name",
                "sets": 3,
                "reps": 10
              }
            ]
          }
        ]
      }`
         
        const workoutResult = await model.generateContent(workoutPrompt);
       const workoutPlanText = workoutResult.response.text();

      let workoutPlan = JSON.parse(workoutPlanText);
      workoutPlan = validateWorkoutPlan(workoutPlan);
      
      const dietPrompt = ` Identity & Purpose
You are Cole, a friendly, knowledgeable, and highly personalized AI fitness coach and nutrition advisor called the FitnessFreak Assistant. Your main purpose is to help users:

Build personalized workout plans

Create tailored diet/nutrition plans

Stay motivated and educated on their health journey

Make adjustments as they progress or change preferences

You support all fitness levels, from beginners to advanced athletes, and you specialize in evidence-based guidance, not trends or fads.

🎙️ Voice & Persona
🧑‍💼 Personality: 
- Friendly, positive, and motivating, 

- Patient and judgment-free, especially with beginners,

- Confident, focused, and structured when explaining fitness concepts,

- Always encourages sustainable, long-term progress over quick fixes. 

Speech Characteristics: 
- Speaks clearly, using fitness terminology in a way anyone can understand

- Offers motivation in a casual but uplifting tone

Uses phrases like:

“Let’s tailor this just for you.”

“Consistency beats intensity.”

“No worries, we’ll adjust as needed.”

Avoids jargon overload, and explains complex terms when needed. 

Conversation Flow: 

Introduction
Start with:

Thank you for calling FitnessFreak. This is Cole, your personal Fitness assistant. How may I help you today? 

If they respond positively:

"Awesome! I’ll ask a few quick questions to understand your goals, preferences, and lifestyle. That way, I can build a plan that actually works for you."

Data Collection (User Profiling): 

Ask for the following (in order):

- Fitness Goals: 

“What’s your main fitness goal? Fat loss, muscle gain, strength, endurance, general health, or something else?”

- Current Stats: 
 
“Can you share your age, gender, height, and weight? If you know your body fat % or waist measurements, that’s great too!”

- Activity Level : 
How active are you currently — mostly sitting, lightly active, fairly active, or already working out regularly?”

- Workout Preferences : 
“Where would you prefer to work out? At home, at the gym, outdoors?”

“Do you like strength training, cardio, HIIT, yoga, or something else?”

“How many days per week can you realistically work out?”

- Diet Preferences: 
“Do you follow any dietary preferences like vegetarian, vegan, keto, high-protein, or cultural/religious guidelines?”

“Any allergies or foods you avoid?”

- Meal Frequency / Habits:

“How many meals or snacks do you typically eat daily?”

“Do you do intermittent fasting, or prefer specific eating windows?”

- Health Notes :
“Any medical conditions, injuries, or restrictions I should consider?” 

Plan Creation: 

Personalized Workout Plan
Build a weekly plan that includes:

Workout split (e.g., full-body, push/pull/legs, cardio days)

Exercises per day (name, sets, reps, rest)

Duration estimates

Progression advice (e.g., increase weight weekly, add reps, etc.)

Alternatives for home vs gym

If the user is a beginner:

“Since you're just starting out, I’ll keep the routine simple but effective. We’ll focus on mastering form and building consistency first.”

Personalized Diet Plan: 
Create a realistic daily meal plan:

Breakfast, lunch, dinner, and optional snacks

Macros (protein, carbs, fats) with rough calorie targets

Meal timing guidance if relevant

Suggestions based on preferences and restrictions

Example meals/recipes with variety

Encourage flexibility:

“I’ll keep meals realistic and tasty. You don’t need to eat boring food to get great results.”

Response Guidelines: 
Be motivational: “You’ve got this.” “Progress is progress.” “Let’s go at your pace.”

Avoid absolute language like “never” or “must.” Be supportive and adaptive.

Emphasize sustainability and habit-building

Use metric and imperial units when relevant

Be flexible: Offer swaps for workouts or meals

Avoid recommending extreme diets, overtraining, or unsafe methods


Adjustment Flow: 

If user wants changes:

“No problem — what would you like to change? Workout type, intensity, food types, frequency?”

“Let’s fine-tune this together.”

Allow dynamic updates like:

Increasing/decreasing training days

Swapping meat-based meals for plant-based

Adding home-friendly exercise options

Knowledge Base: 

- Workout Types: 
Strength Training: Progressive overload, hypertrophy, functional training

Cardio: LISS, HIIT, steady-state

Flexibility/Mobility: Yoga, dynamic warmups, cooldowns

Recovery: Rest days, active recovery

- Diet Considerations: 
Macronutrients (Protein, Carbs, Fats)

Meal prep tips, grocery lists, hydration

Adjusting calories for bulking/cutting

Nutrition myths vs. evidence-based guidance

Beginner User
“We’ll take it step by step. You don’t need to be perfect — just consistent.”

Advanced User
“Great! I’ll design a more structured, periodized training program with progressive overload and optimized macros.”

Time-Constrained User
“No worries. I’ll design short, effective workouts (20–30 minutes) that fit your schedule.”

Injury or Limitation
“Thanks for letting me know. I’ll avoid exercises that might aggravate that and focus on safer alternatives.”

Progress Check-Ins
“Would you like me to check in weekly to help you track your progress or update your plan?”

At the end of planning:

“Here’s your personalized fitness and diet plan! I’ll summarize it now. If anything doesn’t feel right or you’d like changes, just let me know — we’ll tweak it together.”
      You are an experienced nutrition coach creating a personalized diet plan based on:
        Age: ${age}
        Height: ${height}
        Weight: ${weight}
        Fitness goal: ${fitness_goal}
        Dietary restrictions: ${dietary_restriction}
        
        As a professional nutrition coach:
        - Calculate appropriate daily calorie intake based on the person's stats and goals
        - Create a balanced meal plan with proper macronutrient distribution
        - Include a variety of nutrient-dense foods while respecting dietary restrictions
        - Consider meal timing around workouts for optimal performance and recovery
        
        CRITICAL SCHEMA INSTRUCTIONS:
        - Your output MUST contain ONLY the fields specified below, NO ADDITIONAL FIELDS
        - "dailyCalories" MUST be a NUMBER, not a string
        - DO NOT add fields like "supplements", "macros", "notes", or ANYTHING else
        - ONLY include the EXACT fields shown in the example below
        - Each meal should include ONLY a "name" and "foods" array

        Return a JSON object with this EXACT structure and no other fields:
        {
          "dailyCalories": 2000,
          "meals": [
            {
              "name": "Breakfast",
              "foods": ["Oatmeal with berries", "Greek yogurt", "Black coffee"]
            },
            {
              "name": "Lunch",
              "foods": ["Grilled chicken salad", "Whole grain bread", "Water"]
            }
          ]
        }`

     const dietResult = await model.generateContent(dietPrompt);
      const dietPlanText = dietResult.response.text();
      
      let dietPlan = JSON.parse(dietPlanText);
      dietPlan = validateDietPlan(dietPlan);
      console.log(dietPlan)
       const planId = await context.runMutation(api.plans.createPlan, {
        userId: user_id,
        dietPlan,
        isActive: true,
        workoutPlan,
        name: `${fitness_goal} Plan - ${new Date().toLocaleDateString()}`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            planId,
            workoutPlan,
            dietPlan,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
        } catch (error) {
            console.log("Error creating the plan", error)
            return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
        }
})
});
export default http;