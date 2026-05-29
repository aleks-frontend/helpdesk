import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client.js"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const TICKETS: Array<{
  studentName: string
  studentEmail: string
  subject: string
  body: string
  status: 'open' | 'resolved' | 'closed'
  category: 'general' | 'technical' | 'refund'
  daysAgo: number
}> = [
  // --- TECHNICAL ---
  { studentName: 'Liam Patterson', studentEmail: 'liam.patterson@uni.edu', subject: 'Cannot log into the student portal', body: 'Every time I enter my credentials the page just refreshes. I have tried Chrome and Firefox.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Olivia Chen', studentEmail: 'olivia.chen@uni.edu', subject: 'Video lectures not loading on Safari', body: 'The course videos spin forever on Safari 17. They work on Chrome but I prefer Safari.', status: 'resolved', category: 'technical', daysAgo: 3 },
  { studentName: 'Noah Williams', studentEmail: 'noah.w@uni.edu', subject: 'Assignment submission page crashes on upload', body: 'When I try to upload a PDF larger than 5 MB the page throws a 500 error.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Emma Davis', studentEmail: 'emma.davis@uni.edu', subject: 'Two-factor authentication code not arriving', body: 'I set up 2FA last week but the SMS codes stopped coming after I switched phone numbers.', status: 'open', category: 'technical', daysAgo: 0 },
  { studentName: 'James Martinez', studentEmail: 'james.m@uni.edu', subject: 'Discussion board posts disappearing', body: 'I posted a reply in the Week 4 forum and it appeared briefly then vanished. This has happened three times.', status: 'resolved', category: 'technical', daysAgo: 5 },
  { studentName: 'Sophia Anderson', studentEmail: 'sophia.a@uni.edu', subject: 'Grade book shows wrong score for midterm', body: 'My midterm shows 54/100 but the paper I got back has 74/100 written on it. Please check.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Benjamin Taylor', studentEmail: 'ben.taylor@uni.edu', subject: 'Mobile app freezes on quiz submission', body: 'The iOS app freezes for about 30 seconds when I submit a timed quiz, then marks it as late.', status: 'open', category: 'technical', daysAgo: 4 },
  { studentName: 'Isabella Thomas', studentEmail: 'isabella.t@uni.edu', subject: 'Email notifications stopped working', body: 'I used to get emails for new assignment postings but they stopped around 10 days ago.', status: 'closed', category: 'technical', daysAgo: 10 },
  { studentName: 'Mason Jackson', studentEmail: 'mason.j@uni.edu', subject: 'Webcam not detected during proctored exam', body: 'The proctoring software cannot detect my webcam even though it works fine in Zoom.', status: 'open', category: 'technical', daysAgo: 0 },
  { studentName: 'Ava White', studentEmail: 'ava.white@uni.edu', subject: 'PDF resources not downloading', body: 'Clicking "Download" on course resources just opens an empty tab. No file is saved.', status: 'resolved', category: 'technical', daysAgo: 7 },
  { studentName: 'Elijah Harris', studentEmail: 'elijah.h@uni.edu', subject: 'Progress bar stuck at 0% for completed modules', body: 'I finished all four Week 2 modules but the progress bar still shows 0%. Worried it will affect my grade.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Charlotte Lewis', studentEmail: 'charlotte.l@uni.edu', subject: 'Zoom integration link broken for live lectures', body: 'The "Join Lecture" button returns a 404. The session starts in two hours.', status: 'resolved', category: 'technical', daysAgo: 6 },
  { studentName: 'Logan Clark', studentEmail: 'logan.c@uni.edu', subject: 'Screen reader not working with quiz interface', body: 'I use NVDA for accessibility. The quiz answer options are not announced by the screen reader.', status: 'open', category: 'technical', daysAgo: 3 },
  { studentName: 'Amelia Robinson', studentEmail: 'amelia.r@uni.edu', subject: 'Single sign-on redirects to error page', body: 'When I click SSO login from the library portal I land on an "Unauthorized" error page.', status: 'closed', category: 'technical', daysAgo: 14 },
  { studentName: 'Lucas Rodriguez', studentEmail: 'lucas.rod@uni.edu', subject: 'Assignment rubric not visible after submission', body: 'The rubric I could see before submission is now hidden. I need it to understand my grade.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Mia Lewis', studentEmail: 'mia.lewis@uni.edu', subject: 'Audio track out of sync in recorded lectures', body: 'Lecture 3 from last Tuesday has audio that is about 4 seconds behind the slides.', status: 'resolved', category: 'technical', daysAgo: 8 },
  { studentName: 'Henry Walker', studentEmail: 'henry.w@uni.edu', subject: 'Cannot reset password — link expired instantly', body: 'The password reset email says the link expires in 24 hours but clicking it immediately says it has expired.', status: 'open', category: 'technical', daysAgo: 0 },
  { studentName: 'Evelyn Hall', studentEmail: 'evelyn.h@uni.edu', subject: 'Collaborative document editor not syncing', body: 'My group partner and I are working on the shared doc but changes from one side do not appear on the other.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Alexander Young', studentEmail: 'alex.young@uni.edu', subject: 'Wrong timezone applied to quiz deadline', body: 'The quiz deadline shows 11pm but it closed at 8pm my time. I believe the portal is using the wrong timezone.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Harper King', studentEmail: 'harper.king@uni.edu', subject: 'Search function returns no results in course library', body: 'Searching for any keyword in the course material library returns "0 results" even for common terms.', status: 'resolved', category: 'technical', daysAgo: 9 },
  // --- REFUND ---
  { studentName: 'Sebastian Scott', studentEmail: 'seb.scott@uni.edu', subject: 'Refund request — withdrew before census date', body: 'I withdrew from BIOL 201 on March 3rd, two days before the census date. I should be entitled to a full refund of $450.', status: 'open', category: 'refund', daysAgo: 5 },
  { studentName: 'Scarlett Green', studentEmail: 'scarlett.g@uni.edu', subject: 'Double charge on my account this semester', body: 'My bank statement shows two identical charges of $1,200 on January 15th. Please investigate and refund one.', status: 'resolved', category: 'refund', daysAgo: 30 },
  { studentName: 'Jack Adams', studentEmail: 'jack.adams@uni.edu', subject: 'Parking permit refund after car sold', body: 'I sold my car last month and no longer need the parking permit I paid for. Requesting a pro-rated refund.', status: 'open', category: 'refund', daysAgo: 4 },
  { studentName: 'Aria Nelson', studentEmail: 'aria.nelson@uni.edu', subject: 'Course cancelled by instructor — refund status?', body: 'HIST 310 was cancelled two weeks into semester. I was told a refund would be processed but have not received it after 3 weeks.', status: 'open', category: 'refund', daysAgo: 3 },
  { studentName: 'Aiden Carter', studentEmail: 'aiden.c@uni.edu', subject: 'Health insurance opt-out refund not received', body: 'I submitted the health insurance waiver in August and was approved. The $380 refund has not appeared after 6 weeks.', status: 'closed', category: 'refund', daysAgo: 45 },
  { studentName: 'Luna Mitchell', studentEmail: 'luna.m@uni.edu', subject: 'Overpayment on tuition installment plan', body: 'I accidentally paid the full balance in addition to my installment, resulting in a $600 overpayment.', status: 'resolved', category: 'refund', daysAgo: 12 },
  { studentName: 'Owen Perez', studentEmail: 'owen.p@uni.edu', subject: 'Technology fee refund for fully online student', body: 'I am a fully online student living abroad and was charged the on-campus technology fee of $150. Requesting a refund.', status: 'open', category: 'refund', daysAgo: 6 },
  { studentName: 'Penelope Roberts', studentEmail: 'penny.r@uni.edu', subject: 'Scholarship overage refund timeline', body: 'My scholarship exceeds my tuition balance by $800. The financial aid office said a refund cheque would be sent but I have not received it.', status: 'open', category: 'refund', daysAgo: 2 },
  { studentName: 'Ryan Turner', studentEmail: 'ryan.t@uni.edu', subject: 'Lab fee charged for lab I never attended', body: 'I was charged $120 for the CHEM 101 lab fee but I registered for the lecture-only section. Requesting a refund.', status: 'resolved', category: 'refund', daysAgo: 18 },
  { studentName: 'Zoey Phillips', studentEmail: 'zoey.p@uni.edu', subject: 'Refund for textbook rental not returned in time', body: 'The portal showed my return deadline as May 15th but I was charged a late fee. I have a screenshot of the original deadline.', status: 'open', category: 'refund', daysAgo: 7 },
  { studentName: 'Nathan Campbell', studentEmail: 'nate.c@uni.edu', subject: 'Medical withdrawal — full tuition refund request', body: 'I have submitted medical documentation for a full withdrawal due to surgery. Requesting the tuition refund as per policy.', status: 'open', category: 'refund', daysAgo: 1 },
  { studentName: 'Layla Parker', studentEmail: 'layla.p@uni.edu', subject: 'Duplicate payment for residence application', body: 'The residence portal had an error and my card was charged $300 twice for the same application. Please refund one charge.', status: 'resolved', category: 'refund', daysAgo: 20 },
  { studentName: 'Isaac Evans', studentEmail: 'isaac.e@uni.edu', subject: 'Student union fee refund — not on campus', body: 'I am studying fully online this semester and was charged the mandatory student union fee. I would like to appeal for a refund.', status: 'open', category: 'refund', daysAgo: 8 },
  { studentName: 'Violet Edwards', studentEmail: 'violet.e@uni.edu', subject: 'Refund status for summer course that was overbooked', body: 'I was removed from PSYC 220 because the course was overbooked. I paid the deposit but have not received a refund.', status: 'open', category: 'refund', daysAgo: 4 },
  { studentName: 'Christian Collins', studentEmail: 'chris.c@uni.edu', subject: 'Unused meal plan balance refund request', body: 'I am leaving the residence at the end of this semester with $210 remaining on my meal plan. Can this be refunded?', status: 'closed', category: 'refund', daysAgo: 25 },
  // --- GENERAL ---
  { studentName: 'Audrey Stewart', studentEmail: 'audrey.s@uni.edu', subject: 'Extension request for family emergency', body: 'My grandmother passed away last week and I was unable to complete the Week 5 assignment. Could I request a one-week extension?', status: 'open', category: 'general', daysAgo: 2 },
  { studentName: 'Wyatt Sanchez', studentEmail: 'wyatt.s@uni.edu', subject: 'Enrollment verification letter needed', body: 'I need an official enrollment verification letter for my employer. Could this be emailed to me as a PDF?', status: 'resolved', category: 'general', daysAgo: 11 },
  { studentName: 'Brooklyn Morris', studentEmail: 'brooklyn.m@uni.edu', subject: 'Question about late withdrawal policy', body: 'I am considering dropping ECON 302 but we are past the standard drop deadline. What are my options?', status: 'open', category: 'general', daysAgo: 3 },
  { studentName: 'Hunter Rogers', studentEmail: 'hunter.r@uni.edu', subject: 'Name change on student ID and transcripts', body: 'I legally changed my name last month. How do I update my name across the student ID, portal, and official transcripts?', status: 'open', category: 'general', daysAgo: 6 },
  { studentName: 'Savannah Reed', studentEmail: 'savannah.r@uni.edu', subject: 'Accommodation letter not sent to instructor', body: 'Accessibility services approved my accommodation two weeks ago but my MATH 211 professor says they never received the letter.', status: 'resolved', category: 'general', daysAgo: 14 },
  { studentName: 'Dominic Cook', studentEmail: 'dominic.c@uni.edu', subject: 'Transcript request for graduate school application', body: 'I need official transcripts sent to three universities by November 30th. How do I order these?', status: 'closed', category: 'general', daysAgo: 60 },
  { studentName: 'Addison Morgan', studentEmail: 'addison.m@uni.edu', subject: 'Course prerequisite waiver request', body: 'I have equivalent work experience for the prerequisite of CS 301. Can I request a waiver to enrol directly?', status: 'open', category: 'general', daysAgo: 5 },
  { studentName: 'Gavin Bell', studentEmail: 'gavin.b@uni.edu', subject: 'Incorrect major listed on student record', body: 'My student record still shows "Undeclared" even though I declared Computer Science in September.', status: 'resolved', category: 'general', daysAgo: 22 },
  { studentName: 'Paisley Murphy', studentEmail: 'paisley.m@uni.edu', subject: 'Request for incomplete grade in ENGL 101', body: 'Due to a documented illness I could not complete the final project. I am requesting an Incomplete grade per university policy.', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Jaxon Rivera', studentEmail: 'jaxon.r@uni.edu', subject: 'Can I audit a course without being enrolled?', body: 'I am interested in sitting in on ART 150 this semester as an audit. Is this possible and what is the process?', status: 'resolved', category: 'general', daysAgo: 9 },
  { studentName: 'Naomi Cooper', studentEmail: 'naomi.c@uni.edu', subject: 'Graduation application deadline — missed it?', body: 'I think I may have missed the graduation application deadline for the spring convocation. Is there any late submission option?', status: 'open', category: 'general', daysAgo: 3 },
  { studentName: 'Eli Richardson', studentEmail: 'eli.r@uni.edu', subject: 'Study abroad credit transfer question', body: 'I completed two courses at a partner university in Spain last year. How do I get these credited toward my degree?', status: 'closed', category: 'general', daysAgo: 40 },
  { studentName: 'Stella Cox', studentEmail: 'stella.cox@uni.edu', subject: 'Mentor assignment — no contact from mentor', body: 'I was paired with a faculty mentor in Week 1 but have received no contact. Could I be reassigned?', status: 'open', category: 'general', daysAgo: 4 },
  { studentName: 'Declan Howard', studentEmail: 'declan.h@uni.edu', subject: 'Request to take more than the maximum credit load', body: 'I have a GPA above 3.8 and would like to take 22 credits this semester. Who approves overload requests?', status: 'resolved', category: 'general', daysAgo: 16 },
  { studentName: 'Claire Ward', studentEmail: 'claire.ward@uni.edu', subject: 'Internship credit registration help needed', body: 'I secured an internship for next semester and would like to register it for academic credit. What forms do I need?', status: 'open', category: 'general', daysAgo: 2 },
  { studentName: 'Ryder Torres', studentEmail: 'ryder.t@uni.edu', subject: 'Feedback on recent campus Wi-Fi outage', body: 'The campus Wi-Fi was down for six hours on Thursday affecting my ability to submit an assignment on time. I want to flag this formally.', status: 'closed', category: 'general', daysAgo: 7 },
  { studentName: 'Aubrey Peterson', studentEmail: 'aubrey.p@uni.edu', subject: 'Library borrowing limit increase request', body: 'I am working on my thesis and need to borrow more than the standard 10-item limit. Is there a way to request an increase?', status: 'resolved', category: 'general', daysAgo: 19 },
  { studentName: 'Brody Gray', studentEmail: 'brody.g@uni.edu', subject: 'Request letter of good standing', body: 'I need a letter confirming I am in good academic standing for a scholarship application due next week.', status: 'open', category: 'general', daysAgo: 0 },
  { studentName: 'Josephine Ramirez', studentEmail: 'jo.ramirez@uni.edu', subject: 'Timetable clash — two required courses overlap', body: 'SOCI 301 and PSYC 302 are both required for my degree but are scheduled at the same time on Tuesdays. How can I resolve this?', status: 'open', category: 'general', daysAgo: 5 },
  { studentName: 'Micah James', studentEmail: 'micah.j@uni.edu', subject: 'Mature student application for next intake', body: 'I am 28 and do not have traditional entry qualifications. I read about the mature student pathway — can you guide me through it?', status: 'resolved', category: 'general', daysAgo: 33 },
  { studentName: 'Chloe Watson', studentEmail: 'chloe.w@uni.edu', subject: 'International student — work permit question', body: 'My study permit is being renewed. Am I allowed to work during the renewal period while waiting for the new permit?', status: 'open', category: 'general', daysAgo: 6 },
  { studentName: 'Caleb Brooks', studentEmail: 'caleb.b@uni.edu', subject: 'Missing grade for final exam', body: 'Final grades were released yesterday but my ACCT 301 final exam grade is missing. All other grades are showing.', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Peyton Kelly', studentEmail: 'peyton.k@uni.edu', subject: 'Cross-registration at partner university', body: 'I want to take a course at the neighbouring university under the cross-registration agreement. What is the deadline to apply?', status: 'resolved', category: 'general', daysAgo: 28 },
  { studentName: 'Brayden Sanders', studentEmail: 'brayden.s@uni.edu', subject: 'Update emergency contact information', body: 'I need to update the emergency contact on my student profile. I cannot find where to do this in the portal settings.', status: 'resolved', category: 'general', daysAgo: 15 },
  { studentName: 'Mackenzie Price', studentEmail: 'mackenzie.p@uni.edu', subject: 'Complaint about course content accuracy', body: 'Several facts in the HIST 215 lecture slides appear to be incorrect. I have sources. Who is the right person to contact?', status: 'open', category: 'general', daysAgo: 8 },
  { studentName: 'Tucker Bennett', studentEmail: 'tucker.b@uni.edu', subject: 'Application for on-campus housing waitlist', body: 'Residence was full when I applied. How do I get on the waitlist and what are the typical wait times?', status: 'closed', category: 'general', daysAgo: 50 },
  { studentName: 'Sadie Wood', studentEmail: 'sadie.wood@uni.edu', subject: 'Volunteer hours verification for co-op credit', body: 'I completed 120 volunteer hours at a local charity last semester. I need these verified to receive co-op credit.', status: 'open', category: 'general', daysAgo: 4 },
  { studentName: 'Jasper Barnes', studentEmail: 'jasper.b@uni.edu', subject: 'Request for reading week extension approval', body: 'I have a medical procedure scheduled during reading week and am worried about missing the resumption date. Who can approve an extension?', status: 'resolved', category: 'general', daysAgo: 23 },
  { studentName: 'Hazel Ross', studentEmail: 'hazel.ross@uni.edu', subject: 'Confusion about GPA calculation method', body: 'My transcript shows a 3.2 GPA but when I calculate it manually using the published formula I get 3.5. Can someone explain the discrepancy?', status: 'open', category: 'general', daysAgo: 3 },
  { studentName: 'Miles Henderson', studentEmail: 'miles.h@uni.edu', subject: 'Proof of enrolment for student bank account', body: 'My bank requires a current proof of enrolment to activate my student account. Can this be generated from the student portal?', status: 'resolved', category: 'general', daysAgo: 10 },
  { studentName: 'Zoe Coleman', studentEmail: 'zoe.c@uni.edu', subject: 'Partner university exchange application — deadline', body: 'I am interested in the exchange program to the University of Amsterdam for next fall. When is the application deadline?', status: 'open', category: 'general', daysAgo: 5 },
  { studentName: 'Finley Jenkins', studentEmail: 'finley.j@uni.edu', subject: 'Disability services — new documentation submitted', body: 'I submitted updated documentation for my learning disability two weeks ago but have not heard back from disability services.', status: 'open', category: 'general', daysAgo: 2 },
  { studentName: 'Piper Perry', studentEmail: 'piper.p@uni.edu', subject: 'Questions about deferred exam procedures', body: 'I was sick on the day of my midterm and could not attend. How do I apply for a deferred sitting?', status: 'resolved', category: 'general', daysAgo: 17 },
  { studentName: 'Knox Powell', studentEmail: 'knox.p@uni.edu', subject: 'Complaint about noise in the library', body: 'The group study pods near the entrance have been very noisy. Can quiet hours be enforced more strictly?', status: 'closed', category: 'general', daysAgo: 35 },
  { studentName: 'Wren Long', studentEmail: 'wren.long@uni.edu', subject: 'Request for deferred start date', body: 'I have been offered a place for the September intake but need to defer to January due to a visa delay. Is this possible?', status: 'open', category: 'general', daysAgo: 9 },
  { studentName: 'Remi Patterson', studentEmail: 'remi.p@uni.edu', subject: 'Course material not uploaded by instructor', body: 'Week 3 lecture slides for MGMT 210 have not been uploaded and the lecture was four days ago. Other students are also waiting.', status: 'open', category: 'general', daysAgo: 4 },
  { studentName: 'Thea Foster', studentEmail: 'thea.f@uni.edu', subject: 'Recognition of prior learning assessment request', body: 'I have five years of professional experience in data analytics and would like to apply for recognition of prior learning for DS 101.', status: 'resolved', category: 'general', daysAgo: 26 },
  { studentName: 'Cyrus Simmons', studentEmail: 'cyrus.s@uni.edu', subject: 'Student bus pass not activated', body: 'I purchased the semester bus pass two weeks ago but it still shows as inactive on the transit app. I have been paying full fare.', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Sage Alexander', studentEmail: 'sage.a@uni.edu', subject: 'Question about retaking a failed elective', body: 'I failed FREN 101 last semester. Can I retake it this semester and will the original grade be replaced on my transcript?', status: 'resolved', category: 'general', daysAgo: 13 },
  { studentName: 'Lyric Hughes', studentEmail: 'lyric.h@uni.edu', subject: 'Can I switch from full-time to part-time?', body: 'I have been offered a full-time job and would like to switch to part-time studies from next semester. How does the process work?', status: 'open', category: 'general', daysAgo: 3 },
  { studentName: 'Reese Flores', studentEmail: 'reese.f@uni.edu', subject: 'Tutor booking system not showing availability', body: 'The peer tutoring booking system shows no available slots for any subject for the next three weeks.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Ember Washington', studentEmail: 'ember.w@uni.edu', subject: 'Plagiarism report — false positive claim', body: 'My ENGL 203 essay received a 42% similarity score. The flagged sections are all properly cited block quotes. How do I dispute this?', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Valor Bennett', studentEmail: 'valor.b@uni.edu', subject: 'Laptop loan programme — application status', body: 'I applied for a loaner laptop through the hardship programme three weeks ago. Is there a way to check my application status?', status: 'resolved', category: 'general', daysAgo: 21 },
  { studentName: 'Indigo Russell', studentEmail: 'indigo.r@uni.edu', subject: 'Request for a private exam room', body: 'I have anxiety and find large exam halls difficult. Can I request to write my exams in a smaller, quieter room?', status: 'open', category: 'general', daysAgo: 6 },
  { studentName: 'Caspian Griffin', studentEmail: 'caspian.g@uni.edu', subject: 'Error in official transcript — missing course', body: 'PHIL 200 does not appear on my official transcript even though I passed it in 2023 and it shows on my internal record.', status: 'open', category: 'general', daysAgo: 0 },
  { studentName: 'Vesper Diaz', studentEmail: 'vesper.d@uni.edu', subject: 'Refund — equipment hire fee for cancelled lab', body: 'The biology lab practicals were cancelled for the last month of semester. I paid a $75 equipment hire fee and want a pro-rated refund.', status: 'open', category: 'refund', daysAgo: 2 },
  { studentName: 'Orion Hayes', studentEmail: 'orion.h@uni.edu', subject: 'Course evaluation not accessible after deadline', body: 'I missed the course evaluation window by one day. Is there any way to still submit feedback?', status: 'closed', category: 'general', daysAgo: 55 },
  { studentName: 'Fable Marshall', studentEmail: 'fable.m@uni.edu', subject: 'Wi-Fi in residence halls — constant drops', body: 'The wireless connection in Block C drops every 15–20 minutes, making online classes very difficult.', status: 'open', category: 'technical', daysAgo: 3 },
  { studentName: 'Cypress Owens', studentEmail: 'cypress.o@uni.edu', subject: 'Request for grade appeal form', body: 'I believe my final mark in STAT 302 was calculated incorrectly. Where can I find the grade appeal form?', status: 'open', category: 'general', daysAgo: 1 },
  { studentName: 'Marlowe Gordon', studentEmail: 'marlowe.g@uni.edu', subject: 'Withdrawal from sport scholarship commitment', body: 'I was awarded a sport scholarship that requires 10 hours per week. I need to withdraw from this commitment due to injury.', status: 'resolved', category: 'general', daysAgo: 29 },
  { studentName: 'Wisteria Bryant', studentEmail: 'wisteria.b@uni.edu', subject: 'International student — health cover query', body: 'My student health insurance card has not arrived and I have a doctor appointment next week. How can I get proof of coverage?', status: 'open', category: 'general', daysAgo: 4 },
  { studentName: 'Fern Alexander', studentEmail: 'fern.a@uni.edu', subject: 'Charged incorrect international student fee', body: 'I hold permanent residency and should be billed at the domestic tuition rate. My invoice shows the international fee of $9,400 instead.', status: 'open', category: 'refund', daysAgo: 3 },
  { studentName: 'Beckett Sanders', studentEmail: 'beckett.s@uni.edu', subject: 'Final exam schedule conflict', body: 'Two of my final exams are scheduled at the exact same time on December 14th. How is this resolved?', status: 'open', category: 'general', daysAgo: 0 },
  { studentName: 'Sable Price', studentEmail: 'sable.price@uni.edu', subject: 'Thesis submission portal — upload fails at 99%', body: 'I have tried uploading my 80 MB thesis PDF three times. Each time it reaches 99% and then shows a network error.', status: 'open', category: 'technical', daysAgo: 1 },
  { studentName: 'Rigel Foster', studentEmail: 'rigel.f@uni.edu', subject: 'Application for departmental honours', body: 'My GPA qualifies me for departmental honours. When and how do I apply to be considered?', status: 'resolved', category: 'general', daysAgo: 18 },
  { studentName: 'Lyra Coleman', studentEmail: 'lyra.c@uni.edu', subject: 'Clicker device not registering in lecture', body: 'I purchased the required iClicker device but the instructor dashboard never shows my responses during class.', status: 'open', category: 'technical', daysAgo: 5 },
  { studentName: 'Zephyr Jenkins', studentEmail: 'zephyr.j@uni.edu', subject: 'Dining hall dietary accommodation not honoured', body: 'I registered a severe nut allergy with student services but the dining hall staff are not aware of my file.', status: 'open', category: 'general', daysAgo: 2 },
  { studentName: 'Atlas Perry', studentEmail: 'atlas.perry@uni.edu', subject: 'Refund for duplicate library fine payment', body: 'I paid a $15 library fine online and then again at the desk because the system did not update in time. Requesting one payment back.', status: 'resolved', category: 'refund', daysAgo: 8 },
  { studentName: 'Soleil Powell', studentEmail: 'soleil.p@uni.edu', subject: 'Sports facility access blocked after tuition payment', body: 'I paid my tuition in full last week but my student ID is still being declined at the sports facility. The system has not updated.', status: 'open', category: 'technical', daysAgo: 2 },
  { studentName: 'Cosmo Long', studentEmail: 'cosmo.long@uni.edu', subject: 'Request for co-op work term deferral', body: 'I have been offered a co-op position but need to defer my start date by two weeks due to a family commitment. Is this allowed?', status: 'resolved', category: 'general', daysAgo: 24 },
]

async function main() {
  console.log('Seeding 100 tickets…')
  const now = new Date()

  for (const t of TICKETS) {
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - t.daysAgo)
    // spread within the day so ordering is deterministic
    createdAt.setHours(Math.floor(Math.random() * 12) + 8)
    createdAt.setMinutes(Math.floor(Math.random() * 60))

    await prisma.ticket.create({
      data: {
        studentEmail: t.studentEmail,
        studentName: t.studentName,
        subject: t.subject,
        body: t.body,
        status: t.status,
        category: t.category,
        createdAt,
        updatedAt: createdAt,
        messages: {
          create: {
            body: t.body,
            sender: 'student',
            createdAt,
          },
        },
      },
    })
    process.stdout.write('.')
  }

  console.log(`\nDone — ${TICKETS.length} tickets created.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
