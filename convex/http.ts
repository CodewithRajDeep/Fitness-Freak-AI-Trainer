
import { httpRouter } from "convex/server";
import {WebhookEvent} from '@clerk/nextjs/server'
import { Webhook } from "svix";
import { api} from './_generated/api'
import {httpAction} from "./_generated/server"

const http = httpRouter()

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

export default http;