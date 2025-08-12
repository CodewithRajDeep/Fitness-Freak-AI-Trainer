import { v } from "convex/values";
import { mutation } from "./_generated/server";


export const createPlan = mutation({
    args: {
    userId: v.string(),
    name: v.string(),
    workoutPlan: v.object({
      schedule: v.array(v.string()),
      exercises: v.array(
        v.object({
          day: v.string(),
          routines: v.array(
            v.object({
              name: v.string(),
              sets: v.number(),
              reps: v.number(),
            })
          ),
        })
      ),
    }),
    dietPlan: v.object({
      dailyCalories: v.number(),
      meals: v.array(
        v.object({
          name: v.string(),
          foods: v.array(v.string()),
        })
      ),
    }),
    isActive: v.boolean(),
  },
    handler : async(context, args) => {
       const activePlans = await context.db.query("plans")
       .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
       .filter((q) => q.eq(q.field("isActive"), true))
       .collect();

       for(const plan of activePlans){
        await context.db.patch(plan._id, { isActive: false});
       }
       const planId = await context.db.insert("plans", args)
       return planId;
    }
})