import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client.js"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const TICKET_ID = "362464d9-cc87-4792-94c5-877ef2d8a42b"
const AGENT_ID = "iGXegTsAoYoHFMlFKGZVymr4u8UEZ6qb" // Alex

const REPLIES: Array<{
  senderType: "customer" | "agent"
  body: string
  minutesAfterPrevious: number
}> = [
  {
    senderType: "customer",
    minutesAfterPrevious: 5,
    body: `Hi, I wanted to follow up on my original report with some more details about the problem I am experiencing.

I set up two-factor authentication about three weeks ago and it was working perfectly at the time.
I was receiving the SMS codes immediately, usually within 10–15 seconds of requesting them.

Last Tuesday I changed my phone number through my mobile carrier because I switched plans.
I updated the phone number in my account profile on the student portal the same day.
After saving the new number, I tested it by requesting a code and received it without any issues.

However, the following morning when I tried to log in, no SMS code arrived on my new number.
I waited up to 10 minutes on three separate occasions and nothing came through.
I also checked with my carrier and they confirmed the number is active and receiving other messages normally.

I have tried requesting the code from both my laptop and my phone browser with the same result.
Could you please help me figure out what is going wrong?`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 47,
    body: `Hi Jelena,

Thank you for getting in touch and for providing such a detailed description of the problem.
I am sorry to hear you are having trouble accessing your account — I can imagine how frustrating that must be.

I have pulled up your account and can confirm that the phone number change was recorded correctly in our system.
The new number is listed and matches what you updated in your profile settings.

To help me investigate further, could you please confirm a few things:

1. What mobile carrier are you currently using, and in which country is the number registered?
2. Are you able to receive SMS messages from other services (for example, bank notifications or other two-factor codes)?
3. When you request the code, do you see any on-screen confirmation that the SMS has been sent?
4. Have you tried requesting the code more than once in quick succession? Sometimes multiple requests within a short window can cause the messages to be blocked.

Once I have these details I will be able to narrow down whether the issue is on our side or with the SMS delivery provider.
I will also flag this to our technical team in the meantime so they can start looking at the delivery logs.

Best regards,
Alex`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 83,
    body: `Hello Alex,

Thank you for responding so quickly — I really appreciate it.

Here are the answers to your questions:

1. I am on Telekom Srbija and the number is registered in Serbia.
2. Yes, I can receive SMS messages from other services without any problems. My bank sends me codes all the time and they arrive instantly.
3. Yes, the portal does display a message saying "A verification code has been sent to your number ending in XX" where XX matches the last two digits of my new number.
4. I tried requesting the code three times in a row during my last attempt. The first request showed the confirmation message, but the second and third times I got an error saying I had made too many requests and should wait before trying again.

I also want to mention that I tried using the backup codes I saved when I first set up 2FA.
One of them worked and allowed me to log in, which is why I have been able to access my account at all.
But I only have a limited number of backup codes left and I am worried about running out.

Please let me know if there is anything else I can provide to help with the investigation.`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 55,
    body: `Hi Jelena,

Thank you for those details — they are very helpful.

The fact that the portal is showing the correct number and displaying a "code sent" confirmation is a good sign.
It tells us the request is reaching our system and being processed correctly.

The issue is most likely occurring at the SMS delivery stage.
We use a third-party SMS gateway to send verification codes, and there are occasionally delays or blocks for certain carrier and country combinations.
Telekom Srbija is a supported carrier, but I want to confirm there are no current delivery issues with that region.

In the meantime, here are a few things I would like you to try:

1. Log out of the portal completely and clear your browser cache and cookies, then try the login process again.
2. Make sure you are not using a VPN or any network proxy, as these can sometimes interfere with SMS delivery triggers.
3. Try making the login request from a completely different network — for example, switch from Wi-Fi to your mobile data connection, or vice versa.
4. If you have access to another device, try the login from there as well.

I am also going to raise a priority ticket with our SMS gateway provider asking them to check delivery logs for your number.
This may take up to 24 hours for them to respond, but I will keep you updated.

Please let me know the outcome of the steps above.

Best,
Alex`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 120,
    body: `Hi Alex,

I followed all four steps you suggested and here is what happened:

1. Clearing the browser cache and cookies did not make any difference — I still got the "code sent" message but no SMS arrived.
2. I was not using a VPN. I double-checked and confirmed it was turned off.
3. I tried from both my home Wi-Fi and my mobile data connection. Same result on both networks.
4. I borrowed my roommate's laptop and tried from there. Still no SMS.

After all of that, I still have not received a single SMS code on my new number.
The backup code I used this morning was number 7 out of 10, so I am starting to get concerned.

One thing I noticed that might be relevant: when I look at the security settings page, under "Two-factor authentication," it still shows my old number partially masked.
But when I go to my profile settings, the new number is correctly saved there.

Could it be that the 2FA system is still linked to my old number in some database somewhere?
Even though my profile shows the new number, maybe the 2FA configuration was not updated properly?

Thank you for continuing to look into this.`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 38,
    body: `Hi Jelena,

Excellent observation — you may have identified the root cause.

You are absolutely right to notice that the security settings page is showing a different number to your profile page.
This points to a known issue we have seen in a small number of accounts where the phone number change in the profile settings did not propagate correctly to the 2FA configuration table.

Essentially, your profile has been updated but the 2FA module is still referencing your old number.
This is why the "code sent" confirmation appears — the system is technically sending a code, but it is going to a number that is no longer yours.

I have escalated this to our backend engineering team and they have confirmed they can fix this manually from their side.
They will update the 2FA record directly in the database to point to your new number.

This fix should be applied within the next two to three hours.
You do not need to do anything on your end — I will notify you as soon as it has been completed.

In the meantime, please continue to use your backup codes if you need to log in.
I am also going to generate a fresh set of 10 backup codes and add them to your account so you do not run out.

I apologise for the inconvenience and thank you for your patience and for the excellent detective work.

Best,
Alex`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 150,
    body: `Hi Alex,

Thank you so much for figuring that out — it makes complete sense now.

I have been using my backup codes as you suggested and they are working fine for the time being.
I appreciate that you are generating extra codes for me so I will not run out while waiting for the fix.

I just wanted to let you know that I will be in lectures from 10 am to 3 pm today, so I will not be able to check my email during that time.
If the fix gets applied while I am away, I will test it as soon as I get back and report back to you straight away.

I also have a question for when this is fixed: is there any way I can verify that both my profile and the 2FA system are showing the same number?
I would like to be able to check this myself in the future to catch this kind of issue early.

Also, is this a known bug that might affect other students?
If so, I am happy to share any additional information that might help with a broader fix.

Thank you again for all your help — you have been very thorough and responsive.`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 185,
    body: `Hi Jelena,

Great news — the engineering team has applied the fix to your account.

Your 2FA configuration has been updated to reflect your new phone number.
Both your profile and the 2FA module should now show the same number.
I have also added 10 new backup codes to your account, so you now have a full set again.

To answer your questions:

Regarding verifying the number yourself: Unfortunately, the current version of the portal does not display the 2FA phone number separately on the security settings page in a way that can be easily cross-referenced.
Our team has logged this as a feature request and it will be addressed in the next portal update scheduled for next month.
For now, the safest check is to request a test code after any profile change and confirm it arrives.

Regarding other students: This issue appears to have affected a small number of accounts, specifically those where the phone number was changed through the profile page rather than through the security settings directly.
Our team is running a script to identify and fix all affected accounts.
Your report helped us identify and prioritise this, so thank you.

Please test the SMS code login when you are back from lectures and let me know if everything is working correctly.

Best regards,
Alex`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 210,
    body: `Hi Alex,

I just got back from my lectures and tested the login straight away.

I am very happy to report that the SMS code arrived on my new number within about 15 seconds of requesting it.
The login worked perfectly and I was able to get into my account without needing a backup code.

I tried it a second time just to make sure it was not a fluke — logged out, went through the login process again, and the code arrived just as quickly the second time.

I also tested from my phone browser and the mobile data connection and it worked there too.
So the fix seems to be working correctly across all my devices and network configurations.

I do have one small concern to mention: on the security settings page it now shows a partially masked number that I believe is my new number.
However, I cannot tell for certain because so many digits are hidden.
Is there any way to confirm it is definitely pointing to my new number and not some intermediate state?

Also, I noticed that when I logged in successfully, I only used 8 of my original backup codes.
The new ones you mentioned — will they appear somewhere in my settings so I can write them down?

Thank you so much for resolving this so efficiently.`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 65,
    body: `Hi Jelena,

I am really glad to hear the fix is working!

Regarding your questions:

The number shown on the security settings page is indeed your new number.
I can confirm from our backend that the 2FA configuration record now matches your current profile phone number exactly.
The masking is intentional for security purposes — only the last two digits are shown to prevent the full number from being exposed even to logged-in users.

Regarding the backup codes: I have just sent them to your registered email address in a separate message.
Please check your inbox for an email with the subject "Your new backup codes — student portal."
Make sure to store these somewhere safe and offline — a printed copy or a secure password manager is ideal.
Do not store them in the same place as your password.

One general tip for the future: whenever you change your phone number or any security-related setting, it is a good idea to immediately test the 2FA flow rather than waiting until your next login.
This way you can catch any issues straight away while the context is fresh.

I will keep this ticket open for another 48 hours just in case any further issues come up.
After that, if everything continues to work normally, I will mark it as resolved.

Please do not hesitate to reach out if anything else comes up.

Best regards,
Alex`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 95,
    body: `Hi Alex,

I received the email with the backup codes and have saved them securely as you recommended.
Thank you for sending them promptly.

Everything is working correctly now and I feel much more confident about the account security.

I did want to mention one additional thing that occurred to me while testing.
When I was logging in, I noticed the SMS message says "Your student portal verification code is XXXXXX."
The wording seems a bit generic and does not mention the university name.
I only mention it because initially I was not sure the message was from the portal and almost dismissed it as spam.

Perhaps adding the university name to the SMS template would help students identify it more easily.
Just a thought — feel free to pass it on to whoever manages those things.

Also, I wanted to ask whether I should expect any further disruption to my 2FA going forward as a result of this fix.
Or is it a clean fix with no ongoing side effects?

Again, thank you so much for your help with this.
The support has been excellent and I will definitely reach out again if I have any other issues.`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 78,
    body: `Hi Jelena,

Glad the codes arrived and that everything is in order.

That is a really thoughtful piece of feedback about the SMS template.
You are not the first student to mention it and I completely agree — the message could be clearer.
I have logged it as a suggestion and passed it along to the communications team who manage the SMS templates.
It is a simple change but a meaningful one, so I expect it will be updated in the next round of template revisions.

Regarding ongoing side effects from the fix: there should be none.
The change the engineering team made was straightforward — they updated a single record in the 2FA configuration table to match your profile.
No other settings were altered, and no data was lost.
The new number is now the authoritative one across all systems.

Just to summarise what was done to resolve your issue for your own records:

- Your profile phone number was already correct after your update last Tuesday.
- The 2FA configuration table was out of sync and still referenced your old number.
- The engineering team patched the 2FA record directly.
- A fresh set of 10 backup codes was issued to your email.

The fix has been tested from our side and verified by you, so I am confident it is stable.

If you encounter any further problems, feel free to open a new ticket or reply here within the next 48 hours.

Best,
Alex`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 1440,
    body: `Hi Alex,

I wanted to check in after 24 hours of normal usage.

I have logged in four times since the fix was applied — once last evening, once this morning, and twice during study breaks today.
Every single time the SMS code arrived within 10 seconds and the login was smooth.

No issues at all.

I also asked two of my classmates whether they have experienced similar problems after changing their phone numbers.
One of them, Marko, said he had had trouble logging in with SMS codes a few weeks ago but assumed it was a temporary network problem.
He has not changed his phone number recently, so it may be a different issue entirely.
But I thought it worth mentioning in case it is related to the broader problem your team is investigating.

The other classmate has not had any issues.

I think my problem is fully resolved at this point.
Please go ahead and close the ticket whenever it is appropriate.

Thank you again for the thorough and friendly support — you made a stressful situation much easier to deal with.`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 52,
    body: `Hi Jelena,

Thank you for the 24-hour check-in — it is very helpful to know everything has continued to work without issues.

I am glad your login experience is back to normal and that you have not encountered any further problems.

Regarding your classmate Marko: thank you for mentioning this.
If he is experiencing SMS code issues it could be related to the same underlying problem, especially if his account was created or modified around the same time as yours.
Please encourage him to submit a support ticket describing what he experienced, even if it seems resolved now.
Our team is running diagnostics on affected accounts and having his report would help us understand the full scope of the issue.

I am now going to update the status of your ticket to resolved.
A summary of the issue and resolution steps will be attached to the ticket record for reference.

A short satisfaction survey will be sent to your email shortly.
Your feedback is completely optional but very much appreciated — it helps us improve the quality of support.

It has been a pleasure working with you on this.
Thank you for your patience, your clear communication, and your helpful suggestions.
I hope the rest of your semester goes smoothly.

Best regards,
Alex
Student Support Team`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 30,
    body: `Hi Alex,

Thank you for the update and for officially resolving the ticket.

I will definitely pass the message along to Marko and let him know he should submit a ticket.
I spoke to him briefly this afternoon and mentioned that the 2FA sync issue you found might be relevant to his situation.
He seemed interested and said he would check his security settings tonight.

I wanted to say one more time how much I appreciated the quality of support I received.
The way you communicated throughout the process — asking the right questions, explaining what you were doing and why, and giving me clear summaries — made it much easier to stay calm even when I was worried about running out of backup codes.

A few specific things I found particularly helpful:

1. You responded quickly even though I know support teams are often very busy.
2. You anticipated my follow-up questions and answered them before I had to ask.
3. The explanation of why the problem happened was genuinely educational — I now understand how 2FA systems work a little better than I did before.
4. The summary you provided at the end is something I can refer back to if a similar issue ever occurs.

I will fill in the satisfaction survey when it arrives.
Please do not hesitate to use this conversation as a training example if that would be useful.

Have a great rest of the week!

Jelena`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 25,
    body: `Hi Jelena,

Thank you so much for this kind and thoughtful message — it genuinely means a lot.

I will pass your feedback along to my team lead.
Knowing what specifically helped you will allow us to make sure those practices are consistently applied across all of our support interactions.

I am happy to hear that the explanation of the root cause was useful.
Understanding what went wrong and why is something we always try to provide, not just a quick fix, because it helps students feel more in control of their own accounts.

I have now officially marked the ticket as resolved in our system.
You will still be able to read this conversation from your portal history for at least 12 months.

Good luck with the rest of your semester, Jelena.
Feel free to come back to us any time you need help — we are here.

All the best,
Alex
Student Support Team`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 2880,
    body: `Hi Alex,

I hope you do not mind me reopening this thread briefly.

I am logging in this morning and everything is still working perfectly — the SMS codes are arriving without issue.

However, I just noticed something slightly unusual.
When I look at the "Recent security activity" section of my account, it is showing two login attempts from an IP address that I do not recognise.
The attempts were made two days ago at around 2 am and they both failed.

I do not want to be alarmist — failed login attempts happen to everyone — but given that I recently had security issues with my account, I wanted to make sure these are not a cause for concern.

The IP address appears to be in the Netherlands according to the geolocation shown.
I have no connections there and have not used a VPN recently.

Should I change my password as a precaution?
Is there anything else I should do or check?

Thank you for any guidance you can provide.`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 41,
    body: `Hi Jelena,

Thank you for flagging this — you are absolutely right to mention it and it is not being alarmist at all.

Noticing unusual login activity and reporting it promptly is exactly the right thing to do.

Two failed login attempts from an unfamiliar IP are not necessarily a serious cause for concern on their own.
Automated credential stuffing bots regularly attempt logins against university portals using leaked email/password combinations from other services.
Because both attempts failed, they were blocked — likely by the wrong password or by the 2FA requirement.

That said, I would recommend the following steps as a precaution:

1. Change your password today to a new, strong password that you have not used anywhere else.
2. Make sure your 2FA remains active — it appears to be the thing that protected you here.
3. Check whether the email address associated with your account has appeared in any known data breaches. You can do this at haveibeenpwned.com which is a safe and reputable service.
4. Review all the devices listed under your active sessions and revoke any that you do not recognise.

I am also going to flag this activity to our security team so they can cross-reference the IP address with other attempted logins across the system.
This is standard procedure for any report of suspicious activity.

I will reopen the ticket and follow up with you after the security team review, which typically takes one business day.

Please change your password as soon as possible.

Best,
Alex`,
  },
  {
    senderType: "customer",
    minutesAfterPrevious: 35,
    body: `Hi Alex,

Thank you for responding so quickly and for the clear steps.

I have already changed my password — I used a random phrase with numbers and symbols that I have never used for any other account.
I have also checked the active sessions and there was only one device listed which is my own laptop, so that looks fine.

I checked the website you mentioned and my email address did appear in two older data breaches from unrelated services — both of which were several years ago.
I have updated the passwords for those services as well just to be thorough.

I appreciate that you are flagging this to the security team.
Even if it turns out to be routine bot traffic, I would rather know for certain.

One question: should I be concerned that whoever was attempting to log in now knows that my email address is valid?
Some portals give a generic error message regardless of whether the email exists, while others confirm it.
I am not sure what our portal does.

I have also enabled all the additional security notifications in my account settings so I will be alerted to any further suspicious activity straight away.

Thank you again.`,
  },
  {
    senderType: "agent",
    minutesAfterPrevious: 1440,
    body: `Hi Jelena,

Excellent — you have taken all the right precautions and I am glad to hear it.

Regarding your question about the portal confirming whether an email address is valid: I have checked with our development team and our login page does use a generic error message for failed attempts, regardless of whether the email exists in the system.
So an attacker would not be able to confirm your email from the login response alone.

The security team has reviewed the IP address you reported.
It is associated with a known commercial VPN provider and has been flagged across multiple university systems in the past 30 days.
This is a very common pattern for credential stuffing attacks and is not specifically targeted at you.
The attempts on your account appear to be part of a broader automated campaign, not a targeted attack.

The good news is that 2FA blocked both attempts effectively.
Your new, unique password combined with 2FA means your account is well protected.

We have added the IP range to our blocklist as a result of this and other reports.

There is no ongoing cause for concern from my side.
I will close the ticket again now that the security review is complete.

You have handled all of this really well — staying observant and following up appropriately.
That kind of vigilance makes a real difference to account security.

Take care and do not hesitate to reach out if anything else comes up.

Best regards,
Alex
Student Support Team`,
  },
]

async function main() {
  const ticket = await prisma.ticket.findUnique({ where: { id: TICKET_ID } })
  if (!ticket) {
    throw new Error(`Ticket ${TICKET_ID} not found`)
  }

  await prisma.reply.deleteMany({ where: { ticketId: TICKET_ID } })
  console.log("Cleared existing replies for this ticket.")

  let cursor = new Date(ticket.createdAt)
  cursor.setMinutes(cursor.getMinutes() + 3)

  for (let i = 0; i < REPLIES.length; i++) {
    const r = REPLIES[i]
    cursor = new Date(cursor.getTime() + r.minutesAfterPrevious * 60 * 1000)

    await prisma.reply.create({
      data: {
        ticketId: TICKET_ID,
        body: r.body,
        senderType: r.senderType,
        userId: r.senderType === "agent" ? AGENT_ID : null,
        createdAt: cursor,
      },
    })

    process.stdout.write(r.senderType === "agent" ? "A" : "C")
  }

  console.log(`\nDone — ${REPLIES.length} replies created.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
