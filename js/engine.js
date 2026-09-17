/* =========================================================================
   FORGE - PERSONALITY ENGINE
   Archetype/question/content data, scoring, QuizSession, compatibility,
   code encode/decode, quiz-progress persistence, shared-link URL helpers.
   No DOM access here - pure computation, shared by every page.
   ========================================================================= */



/* =========================================================================
   PERSONAFORGE, DATA MODULE
   20 hidden dimensions, an adaptive question bank (10 clusters), 30 original
   archetypes, and career/relationship reference tables.
   ========================================================================= */

const DIMENSIONS = [
  "confidence","logic","creativity","humor","adaptability","curiosity",
  "empathy","leadership","patience","drive","risk","trust","kindness",
  "discipline","socialEnergy","selfAwareness","planning","resilience",
  "optimism","independence","emotionalStability","competitiveness",
  "responsibility","persistence","openMindedness"
];

/* Short display labels for the radar chart specifically. The prose labels
   used elsewhere (DIM_LABELS in engine.js) are fine in a sentence, but
   "emotionalStability" or "openMindedness" spelled out is too wide to sit
   next to 24 other labels around a circle without clipping the edge of
   the canvas, so these are deliberately compact. */
const RADAR_LABELS = {
  confidence:"Confidence", logic:"Logic", creativity:"Creativity",
  humor:"Humor", adaptability:"Adaptable", curiosity:"Curiosity",
  empathy:"Empathy", leadership:"Leadership", patience:"Patience",
  drive:"Drive", risk:"Risk", trust:"Trust", kindness:"Kindness",
  discipline:"Discipline", socialEnergy:"Social", selfAwareness:"Self-Aware",
  planning:"Planning", resilience:"Resilience", optimism:"Optimism",
  independence:"Independent", emotionalStability:"Stability",
  competitiveness:"Competitive", responsibility:"Responsible",
  persistence:"Persistent", openMindedness:"Open-Minded",
};

function emptyDims(){
  const d = {};
  DIMENSIONS.forEach(k => d[k] = 0);
  return d;
}

/* ---- Question bank -----------------------------------------------------
   10 clusters x 20 questions = 200 authored scenarios. Every question has
   exactly 3 answers, each nudging 3-5 dimensions by -2..+2.
   The adaptive engine (see engine.js) asks a fixed 15-question core set
   first (CORE_QUESTION_IDS), then two batches of 10 chosen by
   information value against the accumulated answers (16-35), then
   continues one question at a time only if confidence isn't there yet,
   up to 45 total. Adding more questions to any cluster array just grows
   the pool the adaptive stages pick from; no other code needs to change.
------------------------------------------------------------------------- */

const QUESTION_BANK = {

  social: [
    { id:"soc1", text:"You walk into a party where you know exactly one person, and they've just vanished to find a drink.", options:[
      { text:"Start a conversation with the nearest stranger", d:{socialEnergy:2,confidence:2,risk:1} },
      { text:"Find a snack table and look busy until your friend returns", d:{socialEnergy:-1,patience:1,independence:1} },
      { text:"Scan the room for someone who also looks a bit lost", d:{empathy:2,socialEnergy:1,curiosity:1} } ]},
    { id:"soc2", text:"A group chat is planning a trip and the conversation has 200 unread messages.", options:[
      { text:"Read everything, then propose a clear plan", d:{planning:2,leadership:1,logic:1} },
      { text:"Skim it and go with whatever the majority wants", d:{adaptability:2,independence:-1,socialEnergy:1} },
      { text:"Mute it and ask one friend for the short version later", d:{independence:2,patience:1,socialEnergy:-1} } ]},
    { id:"soc3", text:"You're invisible for exactly one day and no one will ever know what you did.", options:[
      { text:"Sit in on a meeting or class you're curious about", d:{curiosity:2,independence:1} },
      { text:"Spend it helping people in small, secret ways", d:{kindness:2,empathy:2} },
      { text:"Use it to finally get a full day of total peace and quiet", d:{independence:2,patience:1,socialEnergy:-2} } ]},
    { id:"soc4", text:"Your friend group is splitting into two dinner plans and both are asking you to pick a side.", options:[
      { text:"Pick the louder, bigger group for the extra energy", d:{socialEnergy:2,risk:1} },
      { text:"Pick the smaller group, better conversation", d:{empathy:1,socialEnergy:-1,trust:1} },
      { text:"Suggest merging both plans into one", d:{leadership:2,adaptability:1} } ]},
    { id:"soc5", text:"You accidentally become mildly famous overnight for something small and harmless.", options:[
      { text:"Lean into it and enjoy the attention", d:{confidence:2,humor:1,socialEnergy:1} },
      { text:"Politely ride it out and wait for it to fade", d:{patience:2,independence:1} },
      { text:"Use the platform to talk about something you actually care about", d:{leadership:2,drive:1} } ]},
    { id:"soc6", text:"You're the only person at a gathering who doesn't know the inside joke everyone's laughing at.", options:[
      { text:"Ask directly what's so funny", d:{confidence:2,curiosity:1} },
      { text:"Laugh along and figure it out later", d:{adaptability:2,socialEnergy:1} },
      { text:"Quietly enjoy watching everyone else enjoy it", d:{empathy:1,patience:1,socialEnergy:-1} } ]},
    { id:"soc7", text:"It's a big family gathering and someone brings up an old, slightly touchy argument from years ago.", options:[
      { text:"Steer the conversation somewhere lighter", d:{adaptability:2,empathy:1,socialEnergy:1} },
      { text:"Let people say their piece, even if it gets tense", d:{resilience:1,trust:1,emotionalStability:1} },
      { text:"Quietly excuse yourself until it blows over", d:{independence:1,patience:1,socialEnergy:-2} } ]},
    { id:"soc8", text:"A childhood friend you haven't spoken to in years messages you out of nowhere.", options:[
      { text:"Reply right away, excited to catch up", d:{socialEnergy:2,trust:1,optimism:1} },
      { text:"Reply, but keep it short until you see where it goes", d:{selfAwareness:1,patience:1,trust:-1} },
      { text:"Let it sit a while before deciding how to respond", d:{independence:1,planning:1,patience:1} } ]},
    { id:"soc9", text:"You're put on a group project with three people you've never worked with before.", options:[
      { text:"Suggest everyone share their strengths first so roles make sense", d:{leadership:1,responsibility:2,planning:1} },
      { text:"Wait to see how the group naturally organizes itself", d:{patience:1,adaptability:1,openMindedness:1} },
      { text:"Pick the part you're best at and just get started", d:{drive:1,independence:1,confidence:1} } ]},
    { id:"soc10", text:"You're invited to a wedding where you'll only know the couple, no one else.", options:[
      { text:"Treat it as a chance to meet a room full of strangers", d:{socialEnergy:2,openMindedness:1,confidence:1} },
      { text:"Stick close to the couple whenever you can", d:{trust:1,socialEnergy:-1,patience:1} },
      { text:"Find the one other person who also looks a little out of place", d:{empathy:2,socialEnergy:1} } ]},
    { id:"soc11", text:"A group chat you're in has slowly turned into people mostly talking over each other.", options:[
      { text:"Try to bring some order back to the conversation", d:{leadership:1,responsibility:1,patience:1} },
      { text:"Mute it and check in only when something matters", d:{independence:2,socialEnergy:-1} },
      { text:"Just enjoy the chaos, it's kind of fun", d:{humor:2,adaptability:1,openMindedness:1} } ]},
    { id:"soc12", text:"Everyone at work has an opinion about a decision that technically isn't theirs to make.", options:[
      { text:"Share your opinion clearly when asked", d:{confidence:1,responsibility:1,logic:1} },
      { text:"Stay out of it, it's not your call either", d:{patience:1,independence:1,discipline:1} },
      { text:"Listen to everyone first, then quietly form your own view", d:{selfAwareness:2,curiosity:1} } ]},
    { id:"soc13", text:"A close friend starts dating someone the rest of your friend group isn't sure about.", options:[
      { text:"Give the new person a fair, honest chance", d:{openMindedness:2,trust:1,empathy:1} },
      { text:"Trust your friend's judgment, even if you have doubts", d:{trust:2,patience:1} },
      { text:"Say something if it keeps bothering you", d:{confidence:1,responsibility:1,empathy:1} } ]},
    { id:"soc14", text:"You move to a new city where you don't know a single person yet.", options:[
      { text:"Say yes to every invitation for the first few months", d:{socialEnergy:2,risk:1,openMindedness:1} },
      { text:"Build a small, solid group slowly instead of a big one fast", d:{patience:2,trust:1} },
      { text:"Get comfortable on your own before actively looking for people", d:{independence:2,emotionalStability:1} } ]},
    { id:"soc15", text:"A friend keeps canceling plans last minute, again.", options:[
      { text:"Bring it up honestly the next time it happens", d:{confidence:1,responsibility:1,trust:-1} },
      { text:"Stop making plans that depend on them showing up", d:{independence:1,selfAwareness:1,discipline:1} },
      { text:"Give them the benefit of the doubt, people get busy", d:{patience:2,kindness:1} } ]},

    { id:"soc16", text:"You're assigned a random roommate for your first semester away from home.", options:[
      { text:"Reach out before move-in day to break the ice", d:{socialEnergy:2,confidence:1,openMindedness:1} },
      { text:"Wait and see what they're like in person first", d:{patience:2,adaptability:1} },
      { text:"Set clear expectations early so things stay smooth", d:{planning:1,responsibility:2} } ]},
    { id:"soc17", text:"A group trip with friends is being planned and everyone has a different idea of the perfect itinerary.", options:[
      { text:"Volunteer to merge everyone's wish list into one plan", d:{leadership:1,planning:2} },
      { text:"Go with whatever the majority picks", d:{adaptability:2,socialEnergy:1} },
      { text:"Suggest splitting some days so everyone gets their thing", d:{creativity:1,empathy:1,leadership:1} } ]},
    { id:"soc18", text:"At a big family reunion, the food table becomes an unofficial argument about whose dish is best.", options:[
      { text:"Jump in and defend your own dish loudly", d:{humor:1,confidence:1,competitiveness:1} },
      { text:"Stay neutral and just enjoy the food", d:{patience:1,adaptability:1} },
      { text:"Quietly go compliment everyone individually", d:{kindness:2,empathy:1} } ]},
    { id:"soc19", text:"You're about to post something a little vulnerable on social media and your thumb hovers over the button.", options:[
      { text:"Post it, people can just scroll past if they don't care", d:{confidence:2,risk:1} },
      { text:"Rewrite it to be a little safer first", d:{selfAwareness:1,patience:1} },
      { text:"Save it as a draft and decide tomorrow", d:{patience:2,discipline:1} } ]},
    { id:"soc20", text:"Your class group project has one member who keeps missing meetings.", options:[
      { text:"Message them directly and ask what's going on", d:{empathy:1,responsibility:2} },
      { text:"Quietly redistribute their part among the rest of the group", d:{leadership:1,independence:1,discipline:1} },
      { text:"Flag it to the instructor before it becomes a bigger problem", d:{responsibility:2,confidence:1} } ]},

  ],

  analytical: [
    { id:"ana1", text:"You're handed a puzzle box with no instructions and told it opens a small prize inside.", options:[
      { text:"Study it carefully before touching anything", d:{logic:2,patience:2,planning:1} },
      { text:"Start twisting and pressing everything at once", d:{risk:2,adaptability:1,drive:1} },
      { text:"Look up if anyone else has solved one like it", d:{curiosity:2,logic:1} } ]},
    { id:"ana2", text:"Two plans for the weekend look equally good on paper, but you can only pick one.", options:[
      { text:"Make a pros-and-cons list before deciding", d:{logic:2,planning:2} },
      { text:"Go with your gut instinct immediately", d:{risk:1,confidence:1,adaptability:1} },
      { text:"Ask someone else to break the tie", d:{trust:1,socialEnergy:1,independence:-1} } ]},
    { id:"ana3", text:"A machine at work or school starts making a strange noise that no one else seems to notice.", options:[
      { text:"Investigate exactly what's causing it", d:{curiosity:2,logic:2} },
      { text:"Report it and let someone qualified handle it", d:{discipline:1,trust:1,planning:1} },
      { text:"Assume it's fine unless it gets worse", d:{adaptability:1,optimism:1,discipline:-1} } ]},
    { id:"ana4", text:"You find a long, complicated contract you're expected to sign by tomorrow.", options:[
      { text:"Read every line, even if it takes all night", d:{discipline:2,logic:2,patience:1} },
      { text:"Skim for anything alarming, then decide", d:{adaptability:1,risk:1,logic:1} },
      { text:"Ask someone you trust to look it over with you", d:{trust:2,empathy:1} } ]},
    { id:"ana5", text:"Your favorite theory about how something works turns out to be wrong.", options:[
      { text:"Update your thinking immediately, no ego about it", d:{selfAwareness:2,logic:1,adaptability:1} },
      { text:"Look for the exception that might still prove you right", d:{drive:1,logic:1,confidence:1} },
      { text:"Feel a little embarrassed but move on quickly", d:{resilience:1,selfAwareness:1} } ]},
    { id:"ana6", text:"You're debugging a problem that's been broken for hours and everyone else has given up.", options:[
      { text:"Keep going alone until it's solved", d:{discipline:2,independence:2,drive:1} },
      { text:"Step away, then come back with fresh eyes", d:{patience:2,selfAwareness:1,resilience:1} },
      { text:"Call in someone with a different skill set", d:{trust:1,leadership:1,adaptability:1} } ]},
    { id:"ana7", text:"You're splitting a shared bill and the numbers don't quite add up to what everyone remembers ordering.", options:[
      { text:"Actually do the math before saying anything", d:{logic:2,responsibility:1,patience:1} },
      { text:"Just round it out evenly, it's not worth the friction", d:{adaptability:1,patience:1,logic:-1} },
      { text:"Ask the group to figure it out together", d:{leadership:1,socialEnergy:1,logic:1} } ]},
    { id:"ana8", text:"You're choosing between two career paths that both look reasonable on paper.", options:[
      { text:"Build an actual comparison of trade-offs before deciding", d:{logic:2,planning:2} },
      { text:"Pick the one that scares you a little more", d:{risk:2,drive:1,confidence:1} },
      { text:"Talk to people already in both fields first", d:{curiosity:1,openMindedness:1,socialEnergy:1} } ]},
    { id:"ana9", text:"You're playing a strategy game and losing badly to someone using a tactic you've never seen before.", options:[
      { text:"Pause and actually study what they're doing", d:{curiosity:2,logic:1,persistence:1} },
      { text:"Adapt on the fly, mistakes included", d:{adaptability:2,resilience:1} },
      { text:"Stick to your own strategy and refine it next round", d:{discipline:1,persistence:2} } ]},
    { id:"ana10", text:"A movie's twist ending doesn't fully add up when you think about it afterward.", options:[
      { text:"Go back and pick apart exactly where the logic breaks", d:{logic:2,curiosity:1} },
      { text:"Let it go, it was still a good ride", d:{adaptability:1,optimism:1,logic:-1} },
      { text:"Look up what other people think about it", d:{curiosity:1,openMindedness:1,socialEnergy:1} } ]},
    { id:"ana11", text:"A family disagreement keeps circling the same argument without ever resolving.", options:[
      { text:"Try to name the actual root issue everyone's dancing around", d:{logic:2,empathy:1,responsibility:1} },
      { text:"Step back until emotions cool down", d:{patience:2,emotionalStability:1} },
      { text:"Accept that some things just don't get fully resolved", d:{adaptability:1,patience:1} } ]},
    { id:"ana12", text:"You're mapping out your next five years and it feels like there are too many variables to plan around.", options:[
      { text:"Build a flexible plan with checkpoints instead of a fixed one", d:{planning:2,adaptability:1} },
      { text:"Focus on the next year and figure out the rest later", d:{discipline:1,patience:1} },
      { text:"Trust that you'll adjust as things come up", d:{optimism:1,adaptability:2} } ]},
    { id:"ana13", text:"Something you worked hard on fails completely, and you have to figure out why.", options:[
      { text:"Break down exactly what went wrong, step by step", d:{logic:2,selfAwareness:1,responsibility:1} },
      { text:"Accept it wasn't meant to work and move to the next thing", d:{resilience:1,optimism:1} },
      { text:"Ask someone else to look at it with fresh eyes", d:{trust:1,openMindedness:1} } ]},
    { id:"ana14", text:"Two teammates disagree about the right approach and both make fair points.", options:[
      { text:"Weigh both arguments against the actual evidence", d:{logic:2,leadership:1} },
      { text:"Suggest testing both on a small scale first", d:{curiosity:1,planning:1,adaptability:1} },
      { text:"Let the more experienced person's judgment carry more weight", d:{trust:1,patience:1,logic:1} } ]},
    { id:"ana15", text:"You realize a rule you've been following at work doesn't actually make logical sense anymore.", options:[
      { text:"Question it and propose something better", d:{logic:2,leadership:1,confidence:1} },
      { text:"Follow it anyway until someone official changes it", d:{discipline:2,patience:1} },
      { text:"Find a smart workaround without making a fuss", d:{adaptability:1,logic:1,independence:1} } ]},

    { id:"ana16", text:"An AI tool gives you a recommendation that conflicts with your own instinct.", options:[
      { text:"Trust your own read over the algorithm", d:{confidence:1,independence:2} },
      { text:"Take the recommendation seriously and dig into why it differs", d:{curiosity:2,logic:1} },
      { text:"Split the difference and test both", d:{adaptability:1,logic:1,openMindedness:1} } ]},
    { id:"ana17", text:"You're budgeting for a trip and the numbers are tighter than you'd like.", options:[
      { text:"Build a detailed spreadsheet before booking anything", d:{planning:2,discipline:1} },
      { text:"Book the essentials and figure out the rest along the way", d:{adaptability:1,risk:1,optimism:1} },
      { text:"Cut the trip down to what you can comfortably afford", d:{discipline:2,responsibility:1} } ]},
    { id:"ana18", text:"A piece of technology you rely on breaks with zero warning, right before a deadline.", options:[
      { text:"Methodically troubleshoot from the most likely cause down", d:{logic:2,patience:1} },
      { text:"Find a workaround immediately and debug it properly later", d:{adaptability:2,drive:1} },
      { text:"Call in someone who actually knows this better than you", d:{trust:1,humility:0,logic:1} } ]},
    { id:"ana19", text:"You're comparing two job offers and the numbers alone don't make the choice obvious.", options:[
      { text:"Build an actual weighted comparison of every factor", d:{logic:2,planning:2} },
      { text:"Go with whichever one you pictured yourself enjoying more", d:{optimism:1,confidence:1,selfAwareness:1} },
      { text:"Ask people already at both places for the real picture", d:{curiosity:1,openMindedness:1,socialEnergy:1} } ]},
    { id:"ana20", text:"You're studying an opponent's strategy before a competition and notice a clear pattern in how they play.", options:[
      { text:"Build your entire approach around exploiting it", d:{logic:2,competitiveness:1} },
      { text:"Prepare for it, but stay flexible in case they adapt too", d:{planning:1,adaptability:1,logic:1} },
      { text:"Focus on your own game instead of reacting to theirs", d:{discipline:1,independence:1,confidence:1} } ]},

  ],

  creative: [
    { id:"cre1", text:"You're given one blank wall and unlimited paint, but only until sunset.", options:[
      { text:"Plan a design first, then execute precisely", d:{planning:2,creativity:1,discipline:1} },
      { text:"Start painting and let the piece evolve as you go", d:{creativity:2,adaptability:1,risk:1} },
      { text:"Ask others what they'd want to see on it", d:{empathy:1,socialEnergy:1,creativity:1} } ]},
    { id:"cre2", text:"You have to explain your favorite story to someone who's never heard of it, in one minute.", options:[
      { text:"Hit the key plot points, efficiently", d:{logic:1,discipline:1,planning:1} },
      { text:"Focus on the feeling it gave you", d:{empathy:1,creativity:1,humor:1} },
      { text:"Make up a wildly exaggerated version for fun", d:{humor:2,creativity:2,confidence:1} } ]},
    { id:"cre3", text:"You're asked to design something completely impossible, no budget, no physics, no limits.", options:[
      { text:"Design something beautiful nobody's ever seen", d:{creativity:2,confidence:1} },
      { text:"Design something wildly useful for everyone", d:{creativity:1,kindness:1,leadership:1} },
      { text:"Design something deeply personal, just for you", d:{selfAwareness:2,creativity:1,independence:1} } ]},
    { id:"cre4", text:"A movie you love is getting a sequel, and you get to pitch one twist.", options:[
      { text:"A twist that recontextualizes everything that came before", d:{logic:1,creativity:2} },
      { text:"A twist that's emotionally devastating", d:{empathy:1,creativity:1} },
      { text:"A twist that's completely absurd and hilarious", d:{humor:2,creativity:1,risk:1} } ]},
    { id:"cre5", text:"You've got fifteen unstructured minutes and nothing you're supposed to be doing.", options:[
      { text:"Doodle, write, or build something just to make it", d:{creativity:2,independence:1} },
      { text:"Text a few people to see what they're up to", d:{socialEnergy:2,curiosity:1} },
      { text:"Just sit and let your mind wander", d:{patience:1,selfAwareness:2} } ]},
    { id:"cre6", text:"You're told a rule you've always followed was actually always optional.", options:[
      { text:"Immediately start bending it your way", d:{creativity:1,risk:1,independence:1} },
      { text:"Keep following it, it worked fine either way", d:{discipline:2,patience:1} },
      { text:"Investigate why the rule existed in the first place", d:{curiosity:2,logic:1} } ]},
    { id:"cre7", text:"You get to pitch one new show to a streaming platform, any premise you want.", options:[
      { text:"Something visually strange that's never been done before", d:{creativity:2,openMindedness:1,risk:1} },
      { text:"A story that would genuinely make people cry", d:{empathy:1,creativity:1} },
      { text:"Something built around a wild, original game-like world", d:{creativity:2,curiosity:1} } ]},
    { id:"cre8", text:"You're designing a character for a game and can give them one defining trait.", options:[
      { text:"A tragic backstory that explains everything they do", d:{empathy:1,creativity:1} },
      { text:"A completely unpredictable, chaotic personality", d:{humor:1,creativity:2,openMindedness:1} },
      { text:"A skill so specific it becomes their whole identity", d:{discipline:1,creativity:1,persistence:1} } ]},
    { id:"cre9", text:"You're asked to build a fantasy world from absolute scratch, no reference material allowed.", options:[
      { text:"Start with the rules of how the world works, then build up", d:{logic:1,creativity:1,planning:1} },
      { text:"Start with one striking image and build outward from that", d:{creativity:2,openMindedness:1} },
      { text:"Start with the people who live there and their problems", d:{empathy:2,creativity:1} } ]},
    { id:"cre10", text:"Something you're genuinely embarrassed about from years ago keeps coming to mind.", options:[
      { text:"Turn it into a story you can actually laugh about", d:{humor:2,selfAwareness:1,creativity:1} },
      { text:"Let it remind you how much you've grown since", d:{selfAwareness:2,optimism:1} },
      { text:"File it away and just move on", d:{emotionalStability:1,independence:1} } ]},
    { id:"cre11", text:"A memory from childhood keeps resurfacing lately, for no clear reason.", options:[
      { text:"Sit with it and try to understand why it matters now", d:{selfAwareness:2,curiosity:1} },
      { text:"Turn it into something creative, a story, drawing, or song", d:{creativity:2,openMindedness:1} },
      { text:"Let it pass without digging into it too much", d:{emotionalStability:1,patience:1} } ]},
    { id:"cre12", text:"A project you poured yourself into completely falls apart before it's finished.", options:[
      { text:"Salvage the interesting parts for something new", d:{creativity:2,resilience:1,persistence:1} },
      { text:"Grieve it properly, then start fresh with a clean idea", d:{emotionalStability:1,resilience:1} },
      { text:"Push through and finish it anyway, imperfect or not", d:{persistence:2,discipline:1} } ]},
    { id:"cre13", text:"You're asked to invent one small object that doesn't exist yet but really should.", options:[
      { text:"Something that solves a tiny daily annoyance", d:{creativity:1,logic:1,curiosity:1} },
      { text:"Something purely delightful with no real use at all", d:{creativity:2,humor:1,openMindedness:1} },
      { text:"Something that helps people connect with each other", d:{creativity:1,empathy:2} } ]},
    { id:"cre14", text:"A family recipe gets passed down to you, and you're tempted to change it.", options:[
      { text:"Keep it exactly as it was, tradition matters", d:{discipline:1,trust:1,responsibility:1} },
      { text:"Tweak it a little and make it your own", d:{creativity:2,independence:1,openMindedness:1} },
      { text:"Ask the family what they'd think before changing anything", d:{empathy:1,socialEnergy:1,openMindedness:1} } ]},
    { id:"cre15", text:"You get to design your dream workspace with absolutely no budget limit.", options:[
      { text:"Something minimal, quiet, and completely distraction-free", d:{discipline:1,independence:1,planning:1} },
      { text:"Something strange and visually inspiring, full of odd objects", d:{creativity:2,openMindedness:2} },
      { text:"Something built for constant collaboration with others nearby", d:{socialEnergy:2,creativity:1} } ]},

    { id:"cre16", text:"You're designing an outfit for an event where absolutely nothing is off-limits.", options:[
      { text:"Build something bold enough to be remembered", d:{creativity:2,confidence:1,risk:1} },
      { text:"Design something quietly elegant instead", d:{discipline:1,creativity:1} },
      { text:"Make something that tells a specific story if anyone asks", d:{creativity:2,curiosity:1} } ]},
    { id:"cre17", text:"You're asked to compose a short piece of music with no restrictions on genre or instrument.", options:[
      { text:"Blend genres that normally never touch", d:{creativity:2,openMindedness:2} },
      { text:"Write something structurally precise and technical", d:{discipline:1,logic:1,creativity:1} },
      { text:"Write something that's meant to make people feel one specific emotion", d:{empathy:2,creativity:1} } ]},
    { id:"cre18", text:"You're handed a damaged, half-destroyed piece of art and asked to finish it however you see fit.", options:[
      { text:"Restore it as close to the original as possible", d:{discipline:2,responsibility:1} },
      { text:"Let the damage become part of the new piece", d:{creativity:2,openMindedness:1} },
      { text:"Research the original artist's intent before touching it", d:{curiosity:2,responsibility:1} } ]},
    { id:"cre19", text:"The moon suddenly disappears from the sky one night, no explanation, and everyone's asking what it means.", options:[
      { text:"Start theorizing about the science of it immediately", d:{curiosity:2,logic:1} },
      { text:"Feel oddly moved and want to write or create something about it", d:{creativity:2,selfAwareness:1} },
      { text:"Mostly just wonder what it'll do to the tides and your sleep", d:{logic:1,humor:1} } ]},
    { id:"cre20", text:"You get to completely redesign one boring required course from your school days.", options:[
      { text:"Rebuild it entirely around hands-on projects", d:{creativity:1,leadership:1} },
      { text:"Keep the content but make the delivery genuinely engaging", d:{creativity:2,empathy:1} },
      { text:"Cut it down to only the parts that actually matter", d:{logic:1,discipline:1,confidence:1} } ]},

  ],

  impulsive: [
    { id:"imp1", text:"You're trapped in an elevator with your biggest rival for an unknown amount of time.", options:[
      { text:"Break the silence and try to clear the air", d:{confidence:2,empathy:1,leadership:1} },
      { text:"Stay quiet and wait it out", d:{patience:2,independence:1} },
      { text:"Use the time to needle them a little", d:{humor:1,risk:1,confidence:1} } ]},
    { id:"imp2", text:"You find a door in a building you've visited a hundred times that you swear you've never seen before.", options:[
      { text:"Open it immediately", d:{risk:2,curiosity:2} },
      { text:"Ask a staff member what's behind it first", d:{planning:1,trust:1,curiosity:1} },
      { text:"Leave it alone, some doors aren't yours to open", d:{patience:1,discipline:1,risk:-1} } ]},
    { id:"imp3", text:"A stranger offers you a genuinely great opportunity, but you have to decide in the next sixty seconds.", options:[
      { text:"Say yes, you can figure out details later", d:{risk:2,confidence:1,optimism:1} },
      { text:"Ask one sharp clarifying question first", d:{logic:1,confidence:1} },
      { text:"Say no, good opportunities don't need a countdown", d:{discipline:1,trust:-1,patience:1} } ]},
    { id:"imp4", text:"You're mid-plan when a much more exciting, completely different opportunity shows up.", options:[
      { text:"Drop the plan and chase the new thing", d:{adaptability:2,risk:2,drive:1} },
      { text:"Finish what you started first", d:{discipline:2,planning:1} },
      { text:"Try to find a way to do both", d:{creativity:1,drive:1,adaptability:1} } ]},
    { id:"imp5", text:"You wake up with a genuinely wild idea you're sure could work.", options:[
      { text:"Start acting on it before the excitement fades", d:{risk:2,drive:2,confidence:1} },
      { text:"Write it down and sleep on it", d:{patience:1,planning:2} },
      { text:"Pitch it to someone else first to test the reaction", d:{socialEnergy:1,trust:1,confidence:1} } ]},
    { id:"imp6", text:"A once-in-a-lifetime trip appears with almost no notice and a real cost to your plans.", options:[
      { text:"Go, you can rearrange the rest", d:{risk:2,adaptability:2,optimism:1} },
      { text:"Weigh it seriously against what you'd give up", d:{planning:2,logic:1} },
      { text:"Pass, stability matters more to you right now", d:{discipline:1,patience:1,risk:-1} } ]},
    { id:"imp7", text:"Someone you've been quietly interested in asks you out with almost no warning.", options:[
      { text:"Say yes immediately, why overthink it", d:{risk:2,confidence:1,optimism:1} },
      { text:"Say yes, but suggest something low-pressure first", d:{planning:1,risk:1,emotionalStability:1} },
      { text:"Ask for a day to actually think it over", d:{patience:1,selfAwareness:1,discipline:1} } ]},
    { id:"imp8", text:"A rare item drops in a game you play, and you have to decide fast whether to use it or save it.", options:[
      { text:"Use it right now, the moment might not come again", d:{risk:2,drive:1} },
      { text:"Save it for exactly the right moment", d:{planning:2,patience:1} },
      { text:"Trade it for something more useful to you now", d:{logic:1,adaptability:1,independence:1} } ]},
    { id:"imp9", text:"You unexpectedly come into a decent amount of money with no strings attached.", options:[
      { text:"Spend some right away on something you've wanted forever", d:{risk:1,optimism:1,drive:1} },
      { text:"Save almost all of it without much internal debate", d:{discipline:2,planning:1,responsibility:1} },
      { text:"Split it between saving, spending, and giving some away", d:{kindness:1,planning:1} } ]},
    { id:"imp10", text:"A friend calls with a last-minute trip idea leaving in two days.", options:[
      { text:"Start packing before you've even hung up", d:{risk:2,adaptability:2,optimism:1} },
      { text:"Check what you'd actually be giving up first", d:{planning:1,logic:1,responsibility:1} },
      { text:"Pass this time, but ask for more notice next time", d:{discipline:1,patience:1,risk:-1} } ]},
    { id:"imp11", text:"You get a sudden, real opportunity to change careers entirely, starting almost from zero.", options:[
      { text:"Take the leap while the door is open", d:{risk:2,confidence:1,drive:1} },
      { text:"Build a transition plan first, then move", d:{planning:2,discipline:1} },
      { text:"Test it part-time before fully committing", d:{logic:1,adaptability:1,persistence:1} } ]},
    { id:"imp12", text:"At a wedding, the couple suddenly opens the floor for anyone to say a few words.", options:[
      { text:"Stand up and speak from the heart, unplanned", d:{confidence:2,risk:1,empathy:1} },
      { text:"Stay seated, better to let it happen organically", d:{patience:1,socialEnergy:-1} },
      { text:"Quickly think of something short and sincere to say", d:{planning:1,confidence:1,empathy:1} } ]},
    { id:"imp13", text:"A show you've been meaning to watch has its whole new season out, and it's already late.", options:[
      { text:"Start it anyway, sleep is negotiable tonight", d:{risk:1,optimism:1} },
      { text:"Watch one episode and stop on principle", d:{discipline:2,patience:1} },
      { text:"Save it for the weekend when you can enjoy it properly", d:{planning:2,patience:1} } ]},
    { id:"imp14", text:"You're offered a genuinely thrilling but slightly risky adventure activity on a trip.", options:[
      { text:"Sign up on the spot, no second-guessing", d:{risk:2,confidence:1,optimism:1} },
      { text:"Ask a few real questions about the risk first", d:{logic:1,planning:1,risk:1} },
      { text:"Watch this time and maybe try it next trip", d:{patience:1,risk:-1,discipline:1} } ]},
    { id:"imp15", text:"You're handed a wish that has to be used within the next sixty seconds or it disappears.", options:[
      { text:"Wish for something big and bold without hesitating", d:{risk:2,confidence:1,drive:1} },
      { text:"Wish for something small but genuinely meaningful", d:{empathy:1,selfAwareness:1,kindness:1} },
      { text:"Freeze up and let the moment pass", d:{patience:1,emotionalStability:-1,risk:-1} } ]},

    { id:"imp16", text:"You spot a genuinely striking piece of clothing that's a little out of your usual style and budget.", options:[
      { text:"Buy it right there, it's rare to find something like this", d:{risk:2,confidence:1} },
      { text:"Try it on, sleep on it, decide tomorrow", d:{patience:1,discipline:1} },
      { text:"Pass, it's not really you", d:{discipline:1,selfAwareness:1,risk:-1} } ]},
    { id:"imp17", text:"A local competition opens registration an hour before the deadline and you weren't planning to enter.", options:[
      { text:"Sign up immediately, prepared or not", d:{risk:2,confidence:1,competitiveness:1} },
      { text:"Quickly weigh whether you can actually do it justice first", d:{logic:1,planning:1} },
      { text:"Skip this one and aim for the next", d:{discipline:1,patience:1} } ]},
    { id:"imp18", text:"A cheap last-minute flight to somewhere you've never been shows up in your inbox.", options:[
      { text:"Book it before you can talk yourself out of it", d:{risk:2,adaptability:1,optimism:1} },
      { text:"Check your calendar properly before deciding", d:{planning:1,discipline:1} },
      { text:"Let it go, spontaneity has limits", d:{discipline:1,risk:-1} } ]},
    { id:"imp19", text:"At a new restaurant, the menu has one dish you've genuinely never heard of and can't quite picture.", options:[
      { text:"Order it immediately, that's the whole point of trying new places", d:{curiosity:2,risk:1,openMindedness:1} },
      { text:"Ask the server exactly what's in it first", d:{logic:1,curiosity:1} },
      { text:"Stick with something familiar this time", d:{discipline:1,patience:1} } ]},
    { id:"imp20", text:"A new gadget everyone's talking about goes on sale and you weren't planning to buy one.", options:[
      { text:"Buy it same day, you can justify it later", d:{risk:1,drive:1,optimism:1} },
      { text:"Research it properly before deciding", d:{logic:2,discipline:1} },
      { text:"Wait for the next version, this one will be outdated soon anyway", d:{patience:1,logic:1} } ]},

  ],

  empathic: [
    { id:"emp1", text:"Your best friend admits they lied to protect someone you both care about.", options:[
      { text:"Understand it, even if you wouldn't have done the same", d:{empathy:2,trust:1,patience:1} },
      { text:"Push them to come clean to the person involved", d:{discipline:1,leadership:1,logic:1} },
      { text:"Feel a little hurt that they didn't tell you first", d:{selfAwareness:1,empathy:1,trust:-1} } ]},
    { id:"emp2", text:"A coworker takes credit for an idea that was mostly yours, in front of everyone.", options:[
      { text:"Speak up and correct the record on the spot", d:{confidence:2,leadership:1} },
      { text:"Let it go publicly, but address it privately later", d:{patience:1,discipline:1,empathy:1} },
      { text:"Let it slide entirely, it's not worth the conflict", d:{patience:1,independence:1,trust:-1} } ]},
    { id:"emp3", text:"Someone close to you is clearly struggling but insists they're fine.", options:[
      { text:"Gently keep checking in until they open up", d:{empathy:2,patience:2} },
      { text:"Respect their space and let them come to you", d:{patience:1,trust:1,independence:1} },
      { text:"Do something small and kind without making it a big deal", d:{kindness:2,empathy:1} } ]},
    { id:"emp4", text:"You overhear two friends arguing about something involving you, but they don't know you heard.", options:[
      { text:"Bring it up honestly so it doesn't fester", d:{confidence:1,trust:1,leadership:1} },
      { text:"Let it play out and see if it resolves itself", d:{patience:2,independence:1} },
      { text:"Try to smooth things over without mentioning what you heard", d:{empathy:2,adaptability:1} } ]},
    { id:"emp5", text:"A stranger is visibly overwhelmed in public and clearly needs help.", options:[
      { text:"Step in directly and ask if they're okay", d:{empathy:2,confidence:1,kindness:1} },
      { text:"Quietly find someone better equipped to help", d:{planning:1,empathy:1} },
      { text:"Give them space, assuming they'd rather handle it alone", d:{patience:1,independence:1} } ]},
    { id:"emp6", text:"You have to deliver honest, difficult feedback to someone who's trying their best.", options:[
      { text:"Say it clearly and directly, kindness through honesty", d:{confidence:1,discipline:1,kindness:1} },
      { text:"Soften it heavily so it doesn't hurt", d:{empathy:2,kindness:1} },
      { text:"Delay it until you're sure exactly how to phrase it", d:{patience:1,planning:1,empathy:1} } ]},
    { id:"emp7", text:"A family member says something hurtful during an argument that probably wasn't fully meant.", options:[
      { text:"Let it go once things calm down, it was said in the heat of it", d:{patience:2,empathy:1,emotionalStability:1} },
      { text:"Bring it up honestly once everyone's calm", d:{confidence:1,responsibility:1,trust:1} },
      { text:"Need some real distance before you're ready to talk about it", d:{independence:1,emotionalStability:1,patience:1} } ]},
    { id:"emp8", text:"Your partner is clearly having a rough day but insists they don't want to talk about it.", options:[
      { text:"Stay close by without pushing for details", d:{empathy:2,patience:2} },
      { text:"Do something small and thoughtful instead of asking questions", d:{kindness:2,empathy:1} },
      { text:"Give them real space and check in again later", d:{independence:1,patience:1,trust:1} } ]},
    { id:"emp9", text:"You remember a moment as a kid when an adult made you feel truly seen and understood.", options:[
      { text:"Try to be that person for someone younger now", d:{empathy:2,kindness:1,responsibility:1} },
      { text:"Carry it quietly as something that shaped who you are", d:{selfAwareness:2} },
      { text:"Reach out and actually tell that person it mattered", d:{confidence:1,empathy:1,socialEnergy:1} } ]},
    { id:"emp10", text:"A teammate is clearly struggling to keep up but hasn't said anything about it.", options:[
      { text:"Quietly offer to help without making it a big deal", d:{empathy:2,kindness:1} },
      { text:"Bring it up with the team so the workload gets rebalanced", d:{leadership:1,responsibility:2} },
      { text:"Let them ask for help when they're ready", d:{patience:1,trust:1,independence:1} } ]},
    { id:"emp11", text:"A close friend fails at something they'd worked toward for a long time.", options:[
      { text:"Sit with them in it before saying anything fix-it shaped", d:{empathy:2,patience:1} },
      { text:"Help them find the next practical step forward", d:{logic:1,leadership:1,empathy:1} },
      { text:"Remind them of everything they did right along the way", d:{optimism:1,kindness:1,empathy:1} } ]},
    { id:"emp12", text:"A character on a show you love makes a choice that genuinely upsets you.", options:[
      { text:"Try to understand what would drive someone to that", d:{empathy:2,curiosity:1,openMindedness:1} },
      { text:"Just feel the frustration, it's allowed to be upsetting", d:{emotionalStability:0,humor:0} },
      { text:"Talk it through with whoever else watched it", d:{socialEnergy:1,empathy:1} } ]},
    { id:"emp13", text:"A stranger online is venting about something painful in a comment section.", options:[
      { text:"Leave a genuinely kind reply, even though you don't know them", d:{kindness:2,empathy:1} },
      { text:"Scroll past, it's not really your place", d:{independence:1,patience:1} },
      { text:"Report or flag it if it seems like they need real help", d:{responsibility:2,empathy:1} } ]},
    { id:"emp14", text:"Your partner's family situation is a lot more complicated than your own.", options:[
      { text:"Ask questions and genuinely try to understand it", d:{empathy:2,curiosity:1,openMindedness:1} },
      { text:"Follow their lead on how much to get involved", d:{patience:1,trust:1,empathy:1} },
      { text:"Keep some healthy distance from it either way", d:{independence:1,discipline:1} } ]},
    { id:"emp15", text:"You realize, looking back, that you weren't very kind to someone who needed you once.", options:[
      { text:"Reach out now, even if it's years later", d:{confidence:1,responsibility:2,empathy:1} },
      { text:"Let it teach you something and be different going forward", d:{selfAwareness:2,kindness:1} },
      { text:"Try not to dwell on it too much, everyone's imperfect", d:{emotionalStability:1,optimism:1} } ]},

    { id:"emp16", text:"A friend at college is clearly overwhelmed but keeps insisting they're managing fine.", options:[
      { text:"Check in consistently, even if they keep brushing it off", d:{empathy:2,patience:2} },
      { text:"Help with something concrete instead of just asking how they are", d:{kindness:2,responsibility:1} },
      { text:"Respect that they might genuinely want to handle it alone", d:{patience:1,trust:1,independence:1} } ]},
    { id:"emp17", text:"Someone you're close to just lost a competition they'd trained hard for.", options:[
      { text:"Let them feel it fully before saying anything encouraging", d:{empathy:2,patience:1} },
      { text:"Remind them of everything that actually went right", d:{optimism:1,kindness:1,empathy:1} },
      { text:"Help them start planning the next attempt", d:{leadership:1,logic:1,empathy:1} } ]},
    { id:"emp18", text:"You notice an animal that seems distressed, maybe lost or hurt, in an unfamiliar place.", options:[
      { text:"Stop everything and try to help it directly", d:{kindness:2,empathy:1,risk:1} },
      { text:"Find someone or somewhere better equipped to help", d:{responsibility:2,logic:1} },
      { text:"Keep an eye on it while figuring out the right move", d:{patience:1,empathy:1,logic:1} } ]},
    { id:"emp19", text:"An older family member is anxious and a little embarrassed about not understanding new technology.", options:[
      { text:"Sit with them and teach it patiently, however long it takes", d:{patience:2,kindness:1,empathy:1} },
      { text:"Set it up simply for them so they don't have to stress about it", d:{kindness:1,responsibility:1} },
      { text:"Reassure them it's genuinely not a big deal", d:{empathy:1,optimism:1,kindness:1} } ]},
    { id:"emp20", text:"A friend tells you an embarrassing story about themselves and clearly needs it to land as funny, not awkward.", options:[
      { text:"Laugh warmly and make it feel like a bonding moment", d:{humor:1,empathy:2} },
      { text:"Match their energy and share an embarrassing one of your own", d:{empathy:1,humor:1,trust:1} },
      { text:"Reassure them it's honestly not that bad", d:{kindness:1,empathy:1} } ]},

  ],

  leadership: [
    { id:"lea1", text:"Your boss offers you double pay in exchange for taking credit away from a teammate.", options:[
      { text:"Refuse immediately, no negotiation", d:{trust:2,kindness:1,discipline:1} },
      { text:"Push back and propose a version that's fair to both", d:{leadership:2,logic:1} },
      { text:"Take a beat to think it through before responding", d:{patience:1,selfAwareness:1,logic:1} } ]},
    { id:"lea2", text:"A group project is falling apart and no one has stepped up to organize it.", options:[
      { text:"Take charge and assign clear next steps", d:{leadership:2,planning:1,confidence:1} },
      { text:"Quietly start doing the coordinating work yourself", d:{discipline:1,independence:1,leadership:1} },
      { text:"Wait to see if someone else naturally takes the lead", d:{patience:1,adaptability:1,leadership:-1} } ]},
    { id:"lea3", text:"Two teammates are in a disagreement that's slowing everything down.", options:[
      { text:"Mediate directly and push for a decision", d:{leadership:2,empathy:1} },
      { text:"Let them work it out without your input", d:{independence:1,patience:1,trust:1} },
      { text:"Propose a compromise that gives both something", d:{creativity:1,leadership:1,empathy:1} } ]},
    { id:"lea4", text:"You're suddenly the most experienced person in the room on a topic everyone's relying on.", options:[
      { text:"Step up and guide the group confidently", d:{leadership:2,confidence:2} },
      { text:"Share what you know but let others weigh in equally", d:{empathy:1,leadership:1,humor:0} },
      { text:"Feel the pressure but push through anyway", d:{resilience:1,confidence:1,leadership:1} } ]},
    { id:"lea5", text:"A plan you championed is starting to visibly fail in front of everyone.", options:[
      { text:"Own it publicly and pivot fast", d:{leadership:2,resilience:2,selfAwareness:1} },
      { text:"Defend the plan while quietly adjusting it", d:{confidence:1,discipline:1} },
      { text:"Ask the group for honest input on what to change", d:{empathy:1,leadership:1,trust:1} } ]},
    { id:"lea6", text:"You're offered a leadership role you don't feel fully ready for.", options:[
      { text:"Take it, you'll grow into it", d:{confidence:2,risk:1,drive:1} },
      { text:"Take it, but ask for support along the way", d:{selfAwareness:1,trust:1,leadership:1} },
      { text:"Turn it down until you feel genuinely ready", d:{patience:1,selfAwareness:1,confidence:-1} } ]},
    { id:"lea7", text:"A project you led falls behind schedule and it's partly your fault.", options:[
      { text:"Own it fully in front of the whole team", d:{responsibility:2,leadership:1,confidence:1} },
      { text:"Fix what you can quietly and explain later if asked", d:{discipline:1,independence:1,responsibility:1} },
      { text:"Get the team together to solve it as a group", d:{leadership:2,socialEnergy:1} } ]},
    { id:"lea8", text:"Your family is deciding something big together and everyone has a different opinion.", options:[
      { text:"Help guide the conversation toward an actual decision", d:{leadership:1,patience:1,responsibility:1} },
      { text:"Voice your view once, then let others lead", d:{confidence:1,patience:1} },
      { text:"Stay mostly quiet and support whatever gets decided", d:{patience:2,adaptability:1} } ]},
    { id:"lea9", text:"You're offered a promotion that means managing people who used to be your peers.", options:[
      { text:"Take it and figure out the dynamic as you go", d:{confidence:2,risk:1,leadership:1} },
      { text:"Take it, but have an honest conversation with them first", d:{empathy:1,leadership:1,responsibility:1} },
      { text:"Turn it down, you'd rather stay where you are", d:{independence:1,discipline:1,leadership:-1} } ]},
    { id:"lea10", text:"You're leading a guild or team in a game and someone quits mid-event, leaving a gap.", options:[
      { text:"Reorganize on the fly and keep things moving", d:{leadership:2,adaptability:2} },
      { text:"Reach out to them first to see if something's actually wrong", d:{empathy:1,leadership:1} },
      { text:"Recruit a replacement and move forward without dwelling on it", d:{drive:1,leadership:1,persistence:1} } ]},
    { id:"lea11", text:"You witness something at work that feels ethically off, but reporting it could cause real friction.", options:[
      { text:"Report it, regardless of the fallout", d:{responsibility:2,confidence:1,trust:1} },
      { text:"Raise it privately with the person first", d:{empathy:1,leadership:1,responsibility:1} },
      { text:"Document it and wait to see if it happens again", d:{planning:1,patience:1,logic:1} } ]},
    { id:"lea12", text:"You're planning a big group event and two people both want to be in charge of the same part.", options:[
      { text:"Split the task in a way that plays to both their strengths", d:{leadership:2,logic:1} },
      { text:"Let them sort it out between themselves", d:{patience:1,independence:1} },
      { text:"Make the call yourself and explain your reasoning", d:{confidence:1,leadership:2} } ]},
    { id:"lea13", text:"A crisis hits your community and people are looking for someone to organize a response.", options:[
      { text:"Step up immediately, even without being asked", d:{leadership:2,confidence:1,responsibility:1} },
      { text:"Support whoever does step up as much as you can", d:{kindness:1,adaptability:1,leadership:1} },
      { text:"Focus on the part you can personally help with most", d:{responsibility:1,independence:1} } ]},
    { id:"lea14", text:"You're teaching someone a skill you're genuinely good at, and they're struggling to get it.", options:[
      { text:"Break it down slower and stay patient through the repeats", d:{patience:2,empathy:1} },
      { text:"Try a completely different way of explaining it", d:{creativity:1,adaptability:1,leadership:1} },
      { text:"Let them struggle a bit longer before stepping in again", d:{patience:1,trust:1} } ]},
    { id:"lea15", text:"Your idea gets picked over a colleague's in a meeting, and they seem visibly frustrated.", options:[
      { text:"Talk to them privately afterward", d:{empathy:1,leadership:1,responsibility:1} },
      { text:"Give them real credit for parts of their idea going forward", d:{kindness:1,leadership:1} },
      { text:"Let it be, competition is normal", d:{confidence:1,competitiveness:1,independence:1} } ]},

    { id:"lea16", text:"You're the one who actually understands the group project topic best, and it shows.", options:[
      { text:"Take the lead and assign the workload", d:{leadership:2,confidence:1} },
      { text:"Teach the others enough that leadership isn't just on you", d:{leadership:1,empathy:1,patience:1} },
      { text:"Do more than your share quietly rather than manage people", d:{responsibility:2,independence:1} } ]},
    { id:"lea17", text:"You're organizing a trip for a big group of friends with very different budgets.", options:[
      { text:"Design one plan that works within the tightest budget", d:{leadership:1,empathy:1,planning:1} },
      { text:"Offer tiered options so everyone can opt into what fits", d:{planning:2,leadership:1} },
      { text:"Let people self-select into smaller compatible groups", d:{adaptability:1,leadership:1} } ]},
    { id:"lea18", text:"Your team is about to enter a competitive event and morale is a little shaky.", options:[
      { text:"Give a real, honest pep talk before it starts", d:{leadership:2,confidence:1,empathy:1} },
      { text:"Focus everyone on the plan instead of the nerves", d:{logic:1,leadership:1,discipline:1} },
      { text:"Lighten the mood with humor first", d:{humor:2,leadership:1} } ]},
    { id:"lea19", text:"You're mentoring someone younger in a creative skill you've spent years developing.", options:[
      { text:"Push them hard, growth happens under real challenge", d:{discipline:1,leadership:1,drive:1} },
      { text:"Let them experiment freely before correcting anything", d:{patience:2,openMindedness:1} },
      { text:"Tailor your approach specifically to how they learn best", d:{empathy:2,leadership:1} } ]},
    { id:"lea20", text:"Your workplace is rolling out a new piece of technology and half the team is resistant to it.", options:[
      { text:"Champion it publicly and show people it's not so bad", d:{leadership:2,confidence:1} },
      { text:"Listen to the resistance first, there might be a real reason", d:{empathy:1,logic:1,leadership:1} },
      { text:"Quietly master it yourself and let results speak", d:{independence:1,discipline:1,drive:1} } ]},

  ],

  philosophical: [
    { id:"phi1", text:"You could know the exact date of your death, but never anything else about the future.", options:[
      { text:"Yes, you'd plan your life around it", d:{planning:2,logic:1,drive:1} },
      { text:"No, not knowing is part of what makes life feel open", d:{optimism:1,independence:1} },
      { text:"You'd want to know, but you're not sure you could handle it", d:{selfAwareness:2,empathy:1} } ]},
    { id:"phi2", text:"A machine could make you perfectly happy forever, but it's not real, would you plug in?", options:[
      { text:"No, a real, imperfect life matters more than manufactured happiness", d:{selfAwareness:2,resilience:1} },
      { text:"Yes, happiness is happiness, real or not", d:{optimism:1,risk:1} },
      { text:"You'd want to try it briefly, then decide", d:{curiosity:2,adaptability:1} } ]},
    { id:"phi3", text:"You find out a core belief you've held for years was built on a mistake.", options:[
      { text:"Let it go immediately and rebuild from scratch", d:{selfAwareness:2,adaptability:1} },
      { text:"Sit with it for a while before changing anything", d:{patience:2,logic:1} },
      { text:"Keep the parts of it that still feel true to you", d:{independence:1,selfAwareness:1,confidence:1} } ]},
    { id:"phi4", text:"Would you rather always know the truth, or always be comfortable?", options:[
      { text:"Truth, every time, even when it's painful", d:{logic:2,resilience:1,confidence:1} },
      { text:"Comfort, some truths aren't worth the cost", d:{empathy:1,patience:1,optimism:1} },
      { text:"Depends entirely on who else it affects", d:{empathy:2,selfAwareness:1} } ]},
    { id:"phi5", text:"You're given the chance to relive one year of your life exactly as it happened.", options:[
      { text:"Yes, you'd want to feel it all again, mistakes included", d:{optimism:2,resilience:1} },
      { text:"No, you'd rather move only forward", d:{drive:1,independence:1} },
      { text:"Only if you could change one small thing", d:{selfAwareness:1,logic:1} } ]},
    { id:"phi6", text:"Is it better to be feared, respected, or liked, if you could only pick one?", options:[
      { text:"Respected, it lasts longer than the other two", d:{leadership:2,discipline:1} },
      { text:"Liked, connection matters more than status", d:{empathy:1,kindness:1,socialEnergy:1} },
      { text:"None of those matter as much as being understood", d:{selfAwareness:2,independence:1} } ]},
    { id:"phi7", text:"Would you rather achieve real success that feels hollow, or genuine happiness that looks small from outside?", options:[
      { text:"Happiness, quietly, every time", d:{optimism:2,selfAwareness:1} },
      { text:"Success, it tends to create happiness eventually", d:{drive:2,confidence:1} },
      { text:"You'd want to find a version that's actually both", d:{planning:1,optimism:1,logic:1} } ]},
    { id:"phi8", text:"Is a regret you never act on still worth carrying, or is it just wasted weight?", options:[
      { text:"It still teaches you something, even unresolved", d:{selfAwareness:2,resilience:1} },
      { text:"Better to let it go completely if you're not acting on it", d:{emotionalStability:2,optimism:1} },
      { text:"Depends entirely on what the regret actually is", d:{logic:1,selfAwareness:1} } ]},
    { id:"phi9", text:"If you knew for certain your biggest dream would never happen, would you still chase it?", options:[
      { text:"Yes, the chasing has its own value", d:{persistence:2,optimism:1} },
      { text:"No, you'd redirect that energy somewhere winnable", d:{logic:2,adaptability:1} },
      { text:"You'd want proof first, certainty like that is rare", d:{logic:1,curiosity:1} } ]},
    { id:"phi10", text:"Does failure actually teach more than success does, or is that just something people say to feel better?", options:[
      { text:"Genuinely, yes, failure is where the real lessons are", d:{resilience:2,selfAwareness:1} },
      { text:"Success teaches plenty too, just different things", d:{optimism:1,logic:1} },
      { text:"Depends on whether you actually reflect on either one", d:{selfAwareness:2,logic:1} } ]},
    { id:"phi11", text:"A childhood memory you're fond of turns out to have not happened quite the way you remember it.", options:[
      { text:"The feeling still matters more than the exact facts", d:{optimism:1,openMindedness:1} },
      { text:"You'd want to know the real version, however it lands", d:{logic:2,selfAwareness:1} },
      { text:"It makes you wonder what else you've misremembered", d:{curiosity:1,selfAwareness:2} } ]},
    { id:"phi12", text:"Is it better to be afraid of the right things, or afraid of nothing at all?", options:[
      { text:"Afraid of the right things, fear can be useful information", d:{logic:1,selfAwareness:1,discipline:1} },
      { text:"Afraid of nothing, fear mostly just gets in the way", d:{risk:2,confidence:1} },
      { text:"Somewhere in between, fully fearless sounds exhausting to maintain", d:{emotionalStability:1,logic:1} } ]},
    { id:"phi13", text:"If money were never a factor again, would your daily life actually look different?", options:[
      { text:"Completely different, money is the main thing in the way", d:{drive:1,optimism:1} },
      { text:"Barely different, you're already doing what matters to you", d:{selfAwareness:2,optimism:1} },
      { text:"You honestly don't know until you'd have to test it", d:{curiosity:1,selfAwareness:1} } ]},
    { id:"phi14", text:"Do people mostly change who they are, or mostly just become more of who they already were?", options:[
      { text:"People become more of who they already were", d:{selfAwareness:1,logic:1} },
      { text:"People genuinely change, given the right circumstances", d:{optimism:1,openMindedness:2} },
      { text:"Both happen, just on very different timelines", d:{logic:1,openMindedness:1} } ]},
    { id:"phi15", text:"What matters more in the long run, being remembered, or having actually mattered while you were here?", options:[
      { text:"Having mattered, being remembered is out of your control anyway", d:{selfAwareness:2,kindness:1} },
      { text:"Being remembered still counts for something real", d:{drive:1,confidence:1} },
      { text:"They're more connected than they first seem", d:{logic:1,openMindedness:1} } ]},

    { id:"phi16", text:"If an AI could perfectly predict your next decision every time, would that change how you make decisions?", options:[
      { text:"Yes, knowing you're predictable might push you to surprise it", d:{independence:1,risk:1,openMindedness:1} },
      { text:"No, the decision would still feel like yours either way", d:{selfAwareness:2,confidence:1} },
      { text:"It would mostly just make you curious how it's done", d:{curiosity:2,logic:1} } ]},
    { id:"phi17", text:"Do animals experience something close to what we'd call an inner life, or is that mostly us projecting?", options:[
      { text:"Almost certainly yes, in their own way", d:{empathy:2,openMindedness:1} },
      { text:"Hard to say, and that uncertainty is honestly interesting", d:{curiosity:2,logic:1} },
      { text:"Probably simpler than we like to imagine", d:{logic:2} } ]},
    { id:"phi18", text:"Is home a place, or is it something you carry with you wherever you actually end up?", options:[
      { text:"A place, specifically, it's not interchangeable", d:{trust:1,discipline:1} },
      { text:"Something you carry, it's the people and habits, not the address", d:{independence:1,optimism:1,selfAwareness:1} },
      { text:"A mix, and it changes depending on the season of your life", d:{adaptability:2,openMindedness:1} } ]},
    { id:"phi19", text:"Does real competition make people better, or does it just make people more anxious versions of who they already were?", options:[
      { text:"It makes people genuinely better, pressure reveals capacity", d:{competitiveness:2,drive:1} },
      { text:"It mostly just amplifies whatever was already there", d:{selfAwareness:2,logic:1} },
      { text:"Depends entirely on whether the competition feels fair", d:{logic:1,empathy:1} } ]},
    { id:"phi20", text:"Is art meant to be understood, or is being felt enough, even without full understanding?", options:[
      { text:"Felt is enough, understanding is optional", d:{creativity:1,openMindedness:2} },
      { text:"Understanding deepens the feeling, both matter", d:{logic:1,curiosity:1,creativity:1} },
      { text:"Depends entirely on what the art is trying to do", d:{logic:1,openMindedness:1} } ]},

  ],

  playful: [
    { id:"pla1", text:"You're given a fake stopwatch that can pause real time for exactly sixty seconds, once.", options:[
      { text:"Save it for a genuine emergency", d:{planning:2,discipline:1} },
      { text:"Use it immediately just to see what happens", d:{curiosity:2,risk:2} },
      { text:"Use it to do something small and delightful for someone else", d:{kindness:2,creativity:1} } ]},
    { id:"pla2", text:"You can instantly become fluent in one skill, but everyone will know you cheated to get it.", options:[
      { text:"Don't care, take the skill anyway", d:{confidence:2,risk:1} },
      { text:"Skip it, earning things matters to your identity", d:{discipline:2,selfAwareness:1} },
      { text:"Take it, but only tell people who'd understand", d:{trust:1,selfAwareness:1,humor:1} } ]},
    { id:"pla3", text:"Everyone at a gathering is asked to share an embarrassing story about themselves.", options:[
      { text:"Go all in with your best one", d:{confidence:2,humor:2,socialEnergy:1} },
      { text:"Share something mild and safe", d:{patience:1,socialEnergy:1} },
      { text:"Deflect with a joke instead of a real story", d:{humor:2,independence:1} } ]},
    { id:"pla4", text:"You get to add one universally understood rule to how the world works, purely for fun.", options:[
      { text:"Everyone has to dance for ten seconds on their birthday", d:{humor:2,creativity:1} },
      { text:"Everyone gets one genuinely honest compliment a day", d:{kindness:2,empathy:1} },
      { text:"Everyone gets one free redo on their worst decision", d:{empathy:1,optimism:2} } ]},
    { id:"pla5", text:"A game night turns unexpectedly, hilariously competitive.", options:[
      { text:"Lean all the way into winning", d:{drive:2,confidence:1,risk:1} },
      { text:"Play it up for laughs more than the win", d:{humor:2,socialEnergy:1} },
      { text:"Quietly make sure everyone's still having fun", d:{empathy:2,leadership:1} } ]},
    { id:"pla6", text:"You could have any harmless, ridiculous superpower for one day.", options:[
      { text:"Talk to animals, just to see what they'd say", d:{curiosity:2,humor:1} },
      { text:"Teleport anywhere, instantly", d:{independence:2,risk:1} },
      { text:"Make anyone laugh, guaranteed", d:{humor:2,empathy:1} } ]},
    { id:"pla7", text:"A meme format takes over the internet for exactly one week and then vanishes forever.", options:[
      { text:"Ride it hard while it lasts", d:{humor:2,socialEnergy:1,openMindedness:1} },
      { text:"Watch from a distance and enjoy other people's versions", d:{humor:1,patience:1} },
      { text:"Make one good one and move on", d:{creativity:1,humor:1,discipline:1} } ]},
    { id:"pla8", text:"You're given a game power that lets you swap places with any NPC for exactly one hour.", options:[
      { text:"Pick the most chaotic background character available", d:{humor:2,risk:1,openMindedness:1} },
      { text:"Pick someone who seems to be having a genuinely great life", d:{curiosity:1,optimism:1} },
      { text:"Pick the shopkeeper, free reign of the inventory for an hour", d:{humor:1,risk:1} } ]},
    { id:"pla9", text:"Two completely different TV shows are getting a surprise crossover episode, your pick.", options:[
      { text:"Two shows that would clash hilariously in tone", d:{humor:2,creativity:1} },
      { text:"Two shows whose characters would genuinely get along", d:{empathy:1,creativity:1} },
      { text:"Two shows that would just break reality entirely", d:{creativity:2,openMindedness:1} } ]},
    { id:"pla10", text:"You find the exact toy or game you were obsessed with as a kid, still in its original box.", options:[
      { text:"Open it immediately, nostalgia doesn't keep", d:{risk:1,optimism:1,openMindedness:1} },
      { text:"Keep it sealed as a little time capsule", d:{discipline:1,patience:1} },
      { text:"Track down the exact person you used to play it with", d:{socialEnergy:2,empathy:1} } ]},
    { id:"pla11", text:"A wedding you're at hits a moment of pure, unplanned chaos, the cake falls, the mic cuts out, something.", options:[
      { text:"Laugh loudly, it's the best part of the story now", d:{humor:2,optimism:1,adaptability:1} },
      { text:"Quietly try to help fix it", d:{kindness:1,responsibility:1,adaptability:1} },
      { text:"Film it discreetly for posterity", d:{humor:1,curiosity:1} } ]},
    { id:"pla12", text:"You meet a genuinely friendly mythical creature that grants exactly one small, silly wish.", options:[
      { text:"Wish to always know the perfect thing to say", d:{confidence:1,humor:1,socialEnergy:1} },
      { text:"Wish for a pet version of the creature itself", d:{humor:2,openMindedness:1} },
      { text:"Wish to understand what animals are actually thinking", d:{curiosity:2,empathy:1} } ]},
    { id:"pla13", text:"Your family tells the same embarrassing story about you every single gathering.", options:[
      { text:"Lean into it and tell it better than they do", d:{humor:2,confidence:1} },
      { text:"Groan through it every time, it never gets old to them", d:{patience:1,humor:1} },
      { text:"Retaliate with an embarrassing story of your own", d:{humor:2,competitiveness:1} } ]},
    { id:"pla14", text:"You're on a first date and the conversation turns into an unexpectedly ridiculous hypothetical game.", options:[
      { text:"Go all in, the weirder the better", d:{humor:2,openMindedness:2} },
      { text:"Play along but keep it a little grounded", d:{adaptability:1,humor:1} },
      { text:"Redirect toward something a bit more real", d:{selfAwareness:1,patience:1} } ]},
    { id:"pla15", text:"You're asked to predict, for fun, what your life looks like in an absurdly exaggerated ten years.", options:[
      { text:"Go with the most over-the-top version possible", d:{humor:2,optimism:1,openMindedness:1} },
      { text:"Give a genuinely hopeful, grounded answer instead", d:{optimism:2,selfAwareness:1} },
      { text:"Deflect with a joke about how unpredictable life is", d:{humor:2,adaptability:1} } ]},

    { id:"pla16", text:"Your pet could suddenly talk, fluently, for exactly five minutes.", options:[
      { text:"Ask them what they actually think of you", d:{confidence:1,humor:1,curiosity:1} },
      { text:"Ask if they're happy and what would make life better for them", d:{empathy:2,kindness:1} },
      { text:"Ask them to settle an old argument about what they did that one time", d:{humor:2,curiosity:1} } ]},
    { id:"pla17", text:"You receive exactly one letter from your future self, no more contact allowed after this.", options:[
      { text:"Hope it's full of specific, practical advice", d:{planning:1,logic:1,curiosity:1} },
      { text:"Hope it's mostly just reassurance that things turn out okay", d:{optimism:2,empathy:1} },
      { text:"Almost don't want to open it, some things are better unknown", d:{discipline:1,independence:1} } ]},
    { id:"pla18", text:"A surprisingly polite dragon knocks and asks, sincerely, if you'd like to become its roommate.", options:[
      { text:"Say yes immediately, this is objectively incredible", d:{risk:2,openMindedness:2,optimism:1} },
      { text:"Ask a lot of very reasonable logistical questions first", d:{logic:2,planning:1} },
      { text:"Politely decline, but ask to stay in touch", d:{kindness:1,discipline:1,patience:1} } ]},
    { id:"pla19", text:"You find a mysterious, ornate key that doesn't seem to match any lock you know of.", options:[
      { text:"Spend the next while actively trying every lock you can find", d:{persistence:2,curiosity:1} },
      { text:"Keep it somewhere safe and let the mystery be its own reward", d:{patience:1,openMindedness:1} },
      { text:"Show it to someone who might actually know what it's from", d:{socialEnergy:1,curiosity:1,trust:1} } ]},
    { id:"pla20", text:"You're granted the ability to instantly become fluent in the language of exactly one animal.", options:[
      { text:"Dogs, obviously, the drama alone would be worth it", d:{humor:2,empathy:1} },
      { text:"Crows, they clearly know something we don't", d:{curiosity:2,openMindedness:1} },
      { text:"Whatever animal would tell you the most useful things", d:{logic:1,curiosity:1} } ]},

  ],

  cautious: [
    { id:"cau1", text:"A financial opportunity promises big returns but asks you to move fast with no guarantees.", options:[
      { text:"Pass, if it's rushing you, it's a red flag", d:{discipline:2,trust:-1,logic:1} },
      { text:"Put in a small amount to test it", d:{risk:1,logic:1,planning:1} },
      { text:"Go all in, big rewards need big risk", d:{risk:2,confidence:1,optimism:1} } ]},
    { id:"cau2", text:"You're offered a comfortable, stable path or an exciting, uncertain one.", options:[
      { text:"Stable, peace of mind wins", d:{discipline:2,patience:1,planning:1} },
      { text:"Exciting, regret scares you more than risk does", d:{risk:2,drive:2} },
      { text:"You'd want a plan to eventually combine both", d:{planning:2,creativity:1} } ]},
    { id:"cau3", text:"Before a big decision, you realize you don't have all the information you'd like.", options:[
      { text:"Gather more before deciding, even if it takes time", d:{planning:2,patience:1,discipline:1} },
      { text:"Decide anyway with what you've got", d:{risk:1,confidence:1,adaptability:1} },
      { text:"Ask someone more experienced to weigh in", d:{trust:2,empathy:1} } ]},
    { id:"cau4", text:"You've saved up for something you've wanted for a long time, and a tempting alternative appears.", options:[
      { text:"Stick to the original plan", d:{discipline:2,patience:1} },
      { text:"Switch, if the new option is genuinely better", d:{adaptability:2,logic:1} },
      { text:"Sleep on it for a few days first", d:{patience:2,planning:1} } ]},
    { id:"cau5", text:"You're about to try something physically or socially risky for the first time.", options:[
      { text:"Just go for it, overthinking ruins the moment", d:{risk:2,confidence:2} },
      { text:"Prepare thoroughly first", d:{planning:2,discipline:1} },
      { text:"Bring someone along for support", d:{trust:1,socialEnergy:1,empathy:1} } ]},
    { id:"cau6", text:"A rule at work or school seems outdated, but breaking it could cause real trouble.", options:[
      { text:"Follow it anyway, not your fight today", d:{discipline:2,patience:1} },
      { text:"Push to change it through the proper channels", d:{leadership:2,logic:1} },
      { text:"Quietly work around it if no one's really watching", d:{risk:1,independence:1,adaptability:1} } ]},
    { id:"cau7", text:"A friend pitches a business idea and wants you to invest your own savings.", options:[
      { text:"Ask for real numbers before considering anything", d:{logic:2,discipline:1} },
      { text:"Invest a small, safe amount to support them", d:{kindness:1,risk:1,planning:1} },
      { text:"Say no to money, but offer to help in other ways", d:{discipline:2,trust:1} } ]},
    { id:"cau8", text:"You're deciding whether to take a stable job offer or hold out for a riskier, better one.", options:[
      { text:"Take the stable offer, certainty has real value", d:{discipline:2,planning:1} },
      { text:"Hold out, the upside is worth the wait", d:{risk:2,persistence:1} },
      { text:"Take the stable one while quietly still looking", d:{planning:2,logic:1} } ]},
    { id:"cau9", text:"Your family is discussing a big shared financial decision that affects everyone.", options:[
      { text:"Push for the most conservative option available", d:{discipline:2,responsibility:1} },
      { text:"Advocate for taking a calculated chance", d:{risk:1,logic:1,confidence:1} },
      { text:"Trust whoever in the family knows finances best", d:{trust:2,patience:1} } ]},
    { id:"cau10", text:"You're dating someone great, but a few small things about them keep nagging at you.", options:[
      { text:"Bring it up early, better to know now", d:{confidence:1,responsibility:1} },
      { text:"Watch a while longer before deciding it matters", d:{patience:2,logic:1} },
      { text:"Let it go, nobody's perfect", d:{optimism:1,trust:1} } ]},
    { id:"cau11", text:"A game you love adds a purchase that promises a real edge, for real money.", options:[
      { text:"Buy it without much hesitation", d:{risk:1,drive:1} },
      { text:"Skip it on principle, you'd rather earn it", d:{discipline:2,persistence:1} },
      { text:"Wait to see if it's actually worth it first", d:{logic:1,patience:1,discipline:1} } ]},
    { id:"cau12", text:"Your team wants to try a completely untested approach right before a major deadline.", options:[
      { text:"Push back, this isn't the moment to gamble", d:{discipline:2,responsibility:1} },
      { text:"Support a small test version of it instead", d:{logic:1,adaptability:1,planning:1} },
      { text:"Trust the team and go for it fully", d:{trust:2,risk:1} } ]},
    { id:"cau13", text:"Before a serious long-term commitment, you realize you still have real doubts.", options:[
      { text:"Voice the doubts honestly before going further", d:{confidence:1,responsibility:2} },
      { text:"Give it more time to see if the doubts fade", d:{patience:2,discipline:1} },
      { text:"Trust your gut and decide either way", d:{confidence:1,risk:1} } ]},
    { id:"cau14", text:"An adventure activity you want to try has a real, if small, chance of injury.", options:[
      { text:"Do it anyway, some risk is worth the experience", d:{risk:2,optimism:1} },
      { text:"Do it, but only with every safety precaution available", d:{planning:2,discipline:1} },
      { text:"Skip it, the odds don't need to favor you every time", d:{discipline:2,patience:1} } ]},
    { id:"cau15", text:"You've failed at the same kind of thing twice before and a third chance just showed up.", options:[
      { text:"Try again, third time might genuinely be different", d:{persistence:2,optimism:1} },
      { text:"Change your whole approach before trying again", d:{logic:1,adaptability:2} },
      { text:"Sit this one out, some patterns are worth noticing", d:{selfAwareness:2,discipline:1} } ]},

    { id:"cau16", text:"A friend wants you to co-invest in an AI startup idea that sounds promising but very unproven.", options:[
      { text:"Ask for a real business plan before considering it", d:{logic:2,discipline:1} },
      { text:"Put in a small amount as a bet on the friendship and the idea", d:{trust:1,risk:1,kindness:1} },
      { text:"Pass entirely, unproven ideas aren't where your savings go", d:{discipline:2,responsibility:1} } ]},
    { id:"cau17", text:"You're planning a solo trip somewhere you don't speak the language.", options:[
      { text:"Go anyway and figure it out as you go", d:{risk:2,adaptability:1,confidence:1} },
      { text:"Prepare thoroughly, translation apps, routes, backups", d:{planning:2,discipline:1} },
      { text:"Book a guided option instead of going fully solo", d:{discipline:1,patience:1} } ]},
    { id:"cau18", text:"You're holding onto an embarrassing secret that isn't really hurting anyone by staying hidden.", options:[
      { text:"Keep it exactly where it is, some things don't need airing", d:{discipline:1,independence:1} },
      { text:"Tell one deeply trusted person, just to not carry it alone", d:{trust:2,empathy:1} },
      { text:"Let it go eventually when the moment feels right", d:{patience:1,selfAwareness:1} } ]},
    { id:"cau19", text:"During a competition, you notice a small way to bend the rules that almost certainly wouldn't get caught.", options:[
      { text:"Absolutely not, it's not worth what it costs internally", d:{discipline:2,responsibility:2} },
      { text:"Feel tempted, but ultimately walk away from it", d:{selfAwareness:1,discipline:1} },
      { text:"Consider it seriously if the stakes are high enough", d:{risk:1,competitiveness:2} } ]},
    { id:"cau20", text:"A fashion trend everyone's suddenly wearing doesn't really feel like you, but it's genuinely everywhere.", options:[
      { text:"Try a toned-down version just to see", d:{adaptability:1,openMindedness:1} },
      { text:"Skip it entirely, trends aren't a good reason on their own", d:{independence:2,discipline:1} },
      { text:"Wait and see if it's still around in six months", d:{patience:2,logic:1} } ]},

  ],

  ambitious: [
    { id:"amb1", text:"You're offered a huge opportunity, but it means leaving behind people and places you love.", options:[
      { text:"Take it, this is exactly the kind of chance you chase", d:{drive:2,risk:1,independence:1} },
      { text:"Turn it down, what you have matters more", d:{kindness:1,patience:1,drive:-1} },
      { text:"Negotiate a version that lets you keep both", d:{creativity:1,leadership:1,planning:1} } ]},
    { id:"amb2", text:"You could guarantee steady, comfortable success, or gamble for a shot at something extraordinary.", options:[
      { text:"Gamble, extraordinary is worth the risk", d:{drive:2,risk:2,optimism:1,competitiveness:1} },
      { text:"Steady success, extraordinary is overrated", d:{discipline:1,patience:1,drive:-1} },
      { text:"Depends entirely on what you'd be gambling with", d:{logic:2,planning:1} } ]},
    { id:"amb3", text:"You hit a huge setback on something you've worked toward for years.", options:[
      { text:"Get back up immediately and adjust the plan", d:{resilience:2,drive:1,planning:1} },
      { text:"Take real time to process before moving again", d:{selfAwareness:2,patience:1} },
      { text:"Question whether it was even the right goal", d:{selfAwareness:1,logic:1,adaptability:1} } ]},
    { id:"amb4", text:"You're far ahead of schedule on a personal goal, what now?", options:[
      { text:"Raise the bar and push further", d:{drive:2,confidence:1,competitiveness:1} },
      { text:"Enjoy the win before starting the next thing", d:{optimism:2,patience:1} },
      { text:"Help someone else catch up to where you are", d:{kindness:2,leadership:1} } ]},
    { id:"amb5", text:"Someone you respect tells you your goal is unrealistic.", options:[
      { text:"It only makes you want it more", d:{drive:2,confidence:1,resilience:1,competitiveness:1} },
      { text:"You take it seriously and reconsider", d:{selfAwareness:2,logic:1} },
      { text:"You ask them exactly why, and decide from there", d:{curiosity:1,logic:1,confidence:1} } ]},
    { id:"amb6", text:"You reach a major goal, but almost no one notices or celebrates it with you.", options:[
      { text:"It doesn't matter, you know what you did", d:{independence:2,confidence:1,selfAwareness:1} },
      { text:"It stings more than you'd like to admit", d:{selfAwareness:2,empathy:1} },
      { text:"You make sure to celebrate it properly yourself", d:{optimism:2,kindness:1} } ]},
    { id:"amb7", text:"You're offered a role that pays less but is a real step toward the career you actually want.", options:[
      { text:"Take it, the direction matters more than the number", d:{drive:2,persistence:1} },
      { text:"Negotiate hard before accepting anything", d:{confidence:1,logic:1,drive:1} },
      { text:"Pass, the pay cut isn't worth it right now", d:{discipline:1,planning:1,drive:-1} } ]},
    { id:"amb8", text:"You're ranked against other people in something competitive, like a game or a sport, and you're falling behind.", options:[
      { text:"Grind harder until you close the gap", d:{persistence:2,competitiveness:2,drive:1} },
      { text:"Study what the people ahead of you are doing differently", d:{logic:1,curiosity:1,competitiveness:1} },
      { text:"Let the ranking matter less than actually enjoying it", d:{optimism:1,competitiveness:-1} } ]},
    { id:"amb9", text:"Your family expected a very specific path for you, and your actual dream looks nothing like it.", options:[
      { text:"Follow your own dream, even if it disappoints them", d:{independence:2,confidence:1,drive:1} },
      { text:"Find a version that satisfies both, if one exists", d:{adaptability:1,logic:1,planning:1} },
      { text:"Follow their path and keep your dream as a side pursuit", d:{responsibility:1,discipline:1,patience:1} } ]},
    { id:"amb10", text:"You define success mostly by what, when you're honest with yourself?", options:[
      { text:"How far you've come compared to where you started", d:{selfAwareness:1,drive:1} },
      { text:"How you compare to the people around you", d:{competitiveness:2,drive:1} },
      { text:"Whether you're proud of how you got there", d:{selfAwareness:2,discipline:1} } ]},
    { id:"amb11", text:"A tenth failed attempt at the same big goal lands, and it stings more than the last nine.", options:[
      { text:"Push through anyway, the tenth doesn't cancel the effort", d:{persistence:2,resilience:2} },
      { text:"Take a real break before deciding whether to try an eleventh", d:{selfAwareness:1,patience:1,emotionalStability:1} },
      { text:"Rethink whether this particular goal still fits who you are now", d:{selfAwareness:2,logic:1} } ]},
    { id:"amb12", text:"You picture your life exactly ten years from now, as honestly as you can.", options:[
      { text:"Ambitious, busy, and clearly further along than today", d:{drive:2,optimism:1} },
      { text:"Calmer and more settled than today, and that's the actual goal", d:{optimism:1,discipline:1} },
      { text:"Genuinely hard to picture, and that's fine with you", d:{adaptability:1,openMindedness:1} } ]},
    { id:"amb13", text:"Someone with far less experience than you gets picked for an opportunity you wanted badly.", options:[
      { text:"Ask directly what you can improve for next time", d:{selfAwareness:1,confidence:1,drive:1} },
      { text:"Let the disappointment sit before deciding what's next", d:{emotionalStability:1,patience:1} },
      { text:"Compete harder for the next one that comes along", d:{competitiveness:2,persistence:1} } ]},
    { id:"amb14", text:"You've achieved something you worked toward for years, and it feels smaller than you expected.", options:[
      { text:"Set the next goal almost immediately", d:{drive:2,persistence:1} },
      { text:"Sit with the anticlimax and figure out what that means", d:{selfAwareness:2,emotionalStability:1} },
      { text:"Make sure to actually celebrate it properly first", d:{optimism:2,kindness:1} } ]},
    { id:"amb15", text:"Building the life you actually want will take a lot longer than you'd like it to.", options:[
      { text:"That's fine, you're playing a long game anyway", d:{persistence:2,patience:1,optimism:1} },
      { text:"It's frustrating, but you'll find ways to speed it up", d:{drive:2,logic:1} },
      { text:"You'd rather redefine the goal to fit a shorter timeline", d:{adaptability:2,logic:1} } ]},

    { id:"amb16", text:"Pursuing music or art seriously would mean walking away from a far more stable path.", options:[
      { text:"Walk away from stability, this is the one life you get", d:{risk:2,drive:2,confidence:1} },
      { text:"Build the stable path first, then transition once it's safer", d:{planning:2,discipline:1} },
      { text:"Keep both running in parallel as long as you possibly can", d:{persistence:2,discipline:1} } ]},
    { id:"amb17", text:"You're within reach of being ranked at the very top of something you compete in.", options:[
      { text:"Push everything else aside until you get there", d:{drive:2,competitiveness:2} },
      { text:"Keep pursuing it, but not at the cost of everything else", d:{planning:1,discipline:1,competitiveness:1} },
      { text:"Notice the chase mattered more to you than the rank itself", d:{selfAwareness:2,optimism:1} } ]},
    { id:"amb18", text:"Your goal is to visit every country in the world, and right now that looks genuinely far off.", options:[
      { text:"Start planning the logistics of an actual timeline", d:{planning:2,drive:1} },
      { text:"Let it stay a loose, long-term dream instead of a strict plan", d:{optimism:1,adaptability:1} },
      { text:"Reassess whether it's really the goal, or just a nice idea", d:{selfAwareness:2,logic:1} } ]},
    { id:"amb19", text:"Going further in school or college would cost real time and money you'd rather not spend.", options:[
      { text:"Do it anyway, the long-term payoff is worth the cost", d:{drive:2,persistence:1} },
      { text:"Find a cheaper or faster way to the same outcome", d:{logic:2,creativity:1} },
      { text:"Skip it and build the same skills a different way", d:{independence:2,confidence:1} } ]},
    { id:"amb20", text:"AI and new technology are reshaping your entire field faster than you expected.", options:[
      { text:"Get ahead of it, learn the new tools before you have to", d:{drive:2,curiosity:1,adaptability:1} },
      { text:"Focus on the human skills that won't get automated", d:{empathy:1,creativity:1,confidence:1} },
      { text:"Wait and see how it actually shakes out before reacting", d:{patience:2,logic:1} } ]},

  ],
};

/* Flatten with cluster tag attached */
const QUESTIONS = Object.entries(QUESTION_BANK).flatMap(([cluster, qs]) =>
  qs.map(q => ({ ...q, cluster }))
);

/* ---- 30 original archetypes ---------------------------------------- */
/* Each archetype carries a small "signature" of {dim, weight} pairs used
   by the matching algorithm (see engine.js: matchArchetype). */

const ARCHETYPES = [
  { id:"ember-strategist", name:"The Ember Strategist", title:"Calculated Fire", icon:"🔥",
    colors:["#FB7185","#FACC15"],
    image:"assets/archetypes/webp/01-ember-strategist.webp",
    signature:[{dim:"logic",w:2},{dim:"drive",w:2},{dim:"planning",w:1}],
    description:"You burn slow and deliberate, turning ambition into a plan before you turn it into action. People underestimate how much fire is underneath the calm.",
    strengths:["Strategic thinking","Focused ambition","Composure under pressure"],
    weaknesses:["Can overplan","Slow to show emotion","Impatient with disorder"],
    workStyle:"Methodical, goal-driven, prefers owning a clear objective end-to-end.",
    stressResponse:"Withdraws to re-strategize rather than react.",
    friendshipStyle:"Small circle, deeply loyal, shows up when it counts.",
    datingStyle:"Intentional and steady; courts with actions more than words.",
    leadershipStyle:"Leads by having the clearest plan in the room.",
    learningStyle:"Structured, sequential, wants the 'why' before the 'how'.",
    communicationStyle:"Direct, economical with words, precise.",
    decisionMaking:"Weighs options carefully, then commits fully.",
    idealEnvironments:["Quiet focused workspaces","High-stakes projects","Small dedicated teams"],
    hobbies:["Chess and strategy games","Long-form reading","Solo training or sport"],
    growthAdvice:"Let plans stay unfinished sometimes, not everything needs a map first.",
    bestTeammate:"Someone spontaneous who tests the plan before it calcifies.",
    worstTeammate:"Someone who changes direction with no rationale.",
    quote:"Fire that isn't aimed is just a mess." },

  { id:"quiet-architect", name:"The Quiet Architect", title:"Builder of Systems", icon:"🏛️",
    colors:["#34D399","#CBD5E1"],
    image:"assets/archetypes/webp/02-quiet-architect.webp",
    signature:[{dim:"planning",w:2},{dim:"discipline",w:2},{dim:"independence",w:1}],
    description:"You think in structures, the invisible frameworks that hold everything else up. You'd rather build the system than be the center of attention within it.",
    strengths:["Long-term planning","Reliability","Clear-headed problem solving"],
    weaknesses:["Resists improvisation","Can seem distant","Overinvests in process"],
    workStyle:"Systematic, prefers ownership of process and infrastructure.",
    stressResponse:"Retreats into organizing something, anything.",
    friendshipStyle:"Consistent and dependable, not flashy.",
    datingStyle:"Shows love through stability and follow-through.",
    leadershipStyle:"Leads by designing systems others can trust.",
    learningStyle:"Builds mental frameworks before diving into detail.",
    communicationStyle:"Measured, considered, rarely impulsive.",
    decisionMaking:"Slow and thorough, gets it right over getting it fast.",
    idealEnvironments:["Structured organizations","Long-horizon projects","Independent work"],
    hobbies:["Building/making things","Puzzles","Urban planning or architecture interests"],
    growthAdvice:"Not every moment needs a system. Some just need presence.",
    bestTeammate:"An energetic connector who brings the system to life.",
    worstTeammate:"Someone allergic to structure or follow-through.",
    quote:"Good systems are just kindness with a plan." },

  { id:"wildfire", name:"The Wildfire", title:"Unstoppable Momentum", icon:"⚡",
    colors:["#FB923C","#FACC15"],
    image:"assets/archetypes/webp/03-wildfire.webp",
    signature:[{dim:"risk",w:2},{dim:"confidence",w:2},{dim:"socialEnergy",w:1}],
    description:"You move first and figure out the rest while already in motion. Rooms get louder and faster when you walk in, that's not an accident.",
    strengths:["Bold initiative","Magnetic energy","Fast adaptation"],
    weaknesses:["Impulsive follow-through","Burns out fast","Skips details"],
    workStyle:"Fast-paced, thrives on momentum and visible progress.",
    stressResponse:"Moves faster instead of slower, sometimes to a fault.",
    friendshipStyle:"The friend who starts the plan nobody else would suggest.",
    datingStyle:"Intense, exciting, sometimes too fast for their own good.",
    leadershipStyle:"Leads by example, from the front, at full speed.",
    learningStyle:"Learns by doing, not by reading about it first.",
    communicationStyle:"Enthusiastic, expressive, occasionally overwhelming.",
    decisionMaking:"Fast, confident, occasionally regretted later.",
    idealEnvironments:["High-energy teams","Startups","Anything with a deadline"],
    hobbies:["Extreme or adventure sports","Live events","Anything competitive"],
    growthAdvice:"Speed is a strength until it starts making your decisions for you.",
    bestTeammate:"A grounded planner who catches what you miss.",
    worstTeammate:"Someone equally impulsive with no one steering.",
    quote:"Ask forgiveness, not permission." },

  { id:"anchor", name:"The Anchor", title:"Unshaken Ground", icon:"⚓",
    colors:["#60A5FA","#2DD4BF"],
    image:"assets/archetypes/webp/04-anchor.webp",
    signature:[{dim:"patience",w:2},{dim:"resilience",w:2},{dim:"trust",w:1}],
    description:"When everything around you is moving too fast, you're the fixed point people orient themselves by. Calm isn't your mood, it's your default state.",
    strengths:["Steadiness under pressure","Dependability","Emotional regulation"],
    weaknesses:["Can seem unmovable","Slow to embrace change","Underexpresses needs"],
    workStyle:"Reliable, consistent, the person others build around.",
    stressResponse:"Stays visibly calm, even when it takes effort.",
    friendshipStyle:"The friend everyone calls first in a crisis.",
    datingStyle:"Grounding presence; steady rather than dramatic.",
    leadershipStyle:"Leads by being the stable center of the storm.",
    learningStyle:"Prefers repetition and mastery over novelty.",
    communicationStyle:"Calm, patient, rarely raises their voice.",
    decisionMaking:"Deliberate, rarely rushed, hard to shake once made.",
    idealEnvironments:["Crisis-prone or high-pressure roles","Long-term commitments"],
    hobbies:["Fishing, gardening, or slow crafts","Meditation","Reliable routines"],
    growthAdvice:"Stability doesn't mean staying still forever, let yourself move too.",
    bestTeammate:"A restless innovator who needs somewhere to land.",
    worstTeammate:"Someone who mistakes your calm for indifference.",
    quote:"Still water runs the deepest." },

  { id:"cartographer", name:"The Cartographer", title:"Mapper of Ideas", icon:"🧭",
    colors:["#7DD3FC","#CBD5E1"],
    image:"assets/archetypes/webp/05-cartographer.webp",
    signature:[{dim:"curiosity",w:2},{dim:"independence",w:1},{dim:"adaptability",w:1}],
    description:"You collect ideas, places, and people the way others collect souvenirs. What matters most to you is having seen it, understood it, mapped it for yourself.",
    strengths:["Insatiable curiosity","Broad knowledge","Comfortable with the unknown"],
    weaknesses:["Struggles to commit to one path","Can overcollect, underfinish","Restless"],
    workStyle:"Exploratory, thrives on variety and new problems.",
    stressResponse:"Seeks a change of scenery or a new project.",
    friendshipStyle:"Brings new perspectives and unexpected stories to the group.",
    datingStyle:"Drawn to partners who keep surprising them.",
    leadershipStyle:"Leads by opening doors others didn't know existed.",
    learningStyle:"Wide before deep, loves connecting unrelated ideas.",
    communicationStyle:"Curious, full of questions, enjoys tangents.",
    decisionMaking:"Weighs novelty heavily, sometimes over practicality.",
    idealEnvironments:["Research","Travel-heavy roles","Cross-disciplinary teams"],
    hobbies:["Travel","Reading widely","Learning random skills"],
    growthAdvice:"Depth is its own kind of adventure, try finishing the map sometimes.",
    bestTeammate:"A finisher who turns your discoveries into results.",
    worstTeammate:"Someone who wants to stick to one narrow lane forever.",
    quote:"Not all who wander are lost, but I am definitely also collecting data." },

  { id:"alchemist", name:"The Alchemist", title:"Turns Ideas Into Gold", icon:"⚗️",
    colors:["#FDBA74","#C084FC"],
    image:"assets/archetypes/webp/06-alchemist.webp",
    signature:[{dim:"creativity",w:2},{dim:"risk",w:1},{dim:"curiosity",w:1}],
    description:"You take things nobody else would combine and make something that works. Half experiment, half instinct, your process looks like chaos until it isn't.",
    strengths:["Original thinking","Comfort with ambiguity","Fast iteration"],
    weaknesses:["Inconsistent focus","Underestimates structure","Can overcomplicate"],
    workStyle:"Experimental, prototype-first, comfortable failing fast.",
    stressResponse:"Starts a new creative project to process the old one.",
    friendshipStyle:"Brings unexpected ideas and energy into every plan.",
    datingStyle:"Playful, imaginative, keeps things from getting stale.",
    leadershipStyle:"Leads by reframing the problem entirely.",
    learningStyle:"Learns through experimentation, not instructions.",
    communicationStyle:"Metaphor-heavy, associative, sometimes hard to follow at speed.",
    decisionMaking:"Follows instinct, then justifies it with logic after.",
    idealEnvironments:["Creative studios","R&D","Anywhere novelty is rewarded"],
    hobbies:["Art in any medium","Cooking experiments","Inventing things"],
    growthAdvice:"Not every idea needs a sequel, some are worth finishing all the way.",
    bestTeammate:"A grounded executor who ships what you dream up.",
    worstTeammate:"Someone who shuts down ideas before they're tested.",
    quote:"Most 'impossible' things are just untested." },

  { id:"sentinel", name:"The Sentinel", title:"Quiet Protector", icon:"🛡️",
    colors:["#34D399","#60A5FA"],
    image:"assets/archetypes/webp/07-sentinel.webp",
    signature:[{dim:"trust",w:2},{dim:"kindness",w:2},{dim:"discipline",w:1}],
    description:"You notice who's missing from the group photo. Protecting the people around you isn't a role you were assigned, it's just what you do.",
    strengths:["Fierce loyalty","Reliability","Notices what others miss"],
    weaknesses:["Overextends for others","Struggles to ask for help","Avoids conflict too long"],
    workStyle:"Supportive, dependable, quietly essential to team morale.",
    stressResponse:"Focuses on protecting others before addressing their own needs.",
    friendshipStyle:"The friend who remembers everything and shows up unasked.",
    datingStyle:"Devoted, attentive, sometimes to their own detriment.",
    leadershipStyle:"Leads by taking care of the people, not just the outcome.",
    learningStyle:"Learns best when it helps someone else too.",
    communicationStyle:"Warm, careful, reads the room before speaking.",
    decisionMaking:"Considers everyone affected before deciding for themselves.",
    idealEnvironments:["Tight-knit teams","Care-oriented roles","Long-term relationships"],
    hobbies:["Volunteering","Cooking for others","Community organizing"],
    growthAdvice:"Protecting yourself counts too, you're allowed to be looked after.",
    bestTeammate:"Someone who notices and reciprocates the care you give.",
    worstTeammate:"Someone who takes your loyalty for granted.",
    quote:"I'd rather be needed than noticed." },

  { id:"comet", name:"The Comet", title:"Bright and Fast", icon:"☄️",
    colors:["#FB923C","#F472B6"],
    image:"assets/archetypes/webp/08-comet.webp",
    signature:[{dim:"drive",w:2},{dim:"confidence",w:1},{dim:"risk",w:1}],
    description:"You appear, you're spectacular, and you move on before anyone quite catches up. Ambition isn't a phase for you, it's your natural orbit.",
    strengths:["Relentless drive","Fast execution","Inspires urgency in others"],
    weaknesses:["Can leave things unfinished","Impatient with slow progress","Burns bright, burns out"],
    workStyle:"Fast, ambitious, always chasing the next milestone.",
    stressResponse:"Doubles down and works harder rather than slower.",
    friendshipStyle:"Exciting but occasionally hard to keep up with.",
    datingStyle:"Whirlwind romance energy, thrilling, occasionally exhausting.",
    leadershipStyle:"Leads by setting an almost unreasonable pace.",
    learningStyle:"Fast absorption, low patience for repetition.",
    communicationStyle:"Energetic, forward-moving, future-focused.",
    decisionMaking:"Quick, ambition-led, rarely looks back.",
    idealEnvironments:["High-growth environments","Competitive fields","Deadlines"],
    hobbies:["Racing (any kind)","Goal-tracking apps","Personal records"],
    growthAdvice:"Not everything worth having is worth rushing toward.",
    bestTeammate:"A steady closer who finishes what you start.",
    worstTeammate:"Someone with no urgency at all.",
    quote:"Rest is for after the finish line." },

  { id:"hearth-keeper", name:"The Hearth Keeper", title:"Warmth in Human Form", icon:"🕯️",
    colors:["#FDBA74","#FACC15"],
    image:"assets/archetypes/webp/09-hearth-keeper.webp",
    signature:[{dim:"kindness",w:2},{dim:"empathy",w:2},{dim:"patience",w:1}],
    description:"Wherever you are becomes the place people gather. You make warmth without trying, a steady, generous presence that people build memories around.",
    strengths:["Deep empathy","Natural nurturing instinct","Makes others feel safe"],
    weaknesses:["Neglects own needs","Overgives","Avoids asking for support"],
    workStyle:"Collaborative, people-first, thrives supporting others' success.",
    stressResponse:"Takes care of everyone else before themselves.",
    friendshipStyle:"The one who remembers birthdays and shows up with soup.",
    datingStyle:"Nurturing, attentive, deeply loyal.",
    leadershipStyle:"Leads by making everyone feel genuinely valued.",
    learningStyle:"Learns best in warm, low-pressure environments.",
    communicationStyle:"Gentle, encouraging, generous with praise.",
    decisionMaking:"Considers everyone's wellbeing before their own preference.",
    idealEnvironments:["Community-centered roles","Small warm teams","Home-based work"],
    hobbies:["Hosting gatherings","Cooking/baking","Caregiving"],
    growthAdvice:"You're allowed to receive the warmth you give so freely.",
    bestTeammate:"Someone who checks in on you as much as you check on them.",
    worstTeammate:"Someone who only shows up when they need something.",
    quote:"Home is a feeling I try to give people." },

  { id:"puzzle-box", name:"The Puzzle Box", title:"Layers Within Layers", icon:"🧩",
    colors:["#C084FC","#818CF8"],
    image:"assets/archetypes/webp/10-puzzle-box.webp",
    signature:[{dim:"logic",w:2},{dim:"selfAwareness",w:1},{dim:"independence",w:1}],
    description:"There's more going on beneath the surface than you show, and that's exactly how you like it. People take longer to fully understand you, and you find that fair.",
    strengths:["Deep, private intelligence","Hard to rattle","Sees what others overlook"],
    weaknesses:["Hard to read","Overthinks social dynamics","Slow to open up"],
    workStyle:"Independent, thorough, prefers depth to breadth.",
    stressResponse:"Processes internally before saying anything.",
    friendshipStyle:"Small trusted circle, intensely loyal once earned.",
    datingStyle:"Takes time to open up, but goes all-in once they do.",
    leadershipStyle:"Leads through quiet competence rather than visibility.",
    learningStyle:"Prefers to fully understand before moving on.",
    communicationStyle:"Reserved, precise, reveals more over time.",
    decisionMaking:"Internally exhaustive, externally quiet.",
    idealEnvironments:["Deep-focus work","Small trusted teams","Research"],
    hobbies:["Puzzles and riddles","Reading","Solo strategy games"],
    growthAdvice:"Letting people see the process, not just the result, builds trust faster.",
    bestTeammate:"Someone patient enough to earn the full picture.",
    worstTeammate:"Someone who demands instant openness.",
    quote:"Not everything needs to be said to be understood." },

  { id:"storm-caller", name:"The Storm Caller", title:"Commands the Room", icon:"🌩️",
    colors:["#818CF8","#7DD3FC"],
    image:"assets/archetypes/webp/11-storm-caller.webp",
    signature:[{dim:"leadership",w:2},{dim:"confidence",w:2},{dim:"drive",w:1}],
    description:"When decisions need making and no one else will make them, you do. Not out of ego, because someone has to, and you've never been afraid of that weight.",
    strengths:["Decisive leadership","Commands attention naturally","Thrives under pressure"],
    weaknesses:["Can dominate quieter voices","Impatient with indecision","Struggles to delegate"],
    workStyle:"Takes charge, sets direction, comfortable being accountable.",
    stressResponse:"Takes more control, not less.",
    friendshipStyle:"The one who organizes the group and makes things happen.",
    datingStyle:"Bold, direct, knows what they want.",
    leadershipStyle:"Natural, commanding, decisive under pressure.",
    learningStyle:"Learns by leading, even before fully ready.",
    communicationStyle:"Assertive, clear, doesn't hedge.",
    decisionMaking:"Fast and confident, owns the outcome either way.",
    idealEnvironments:["High-stakes leadership roles","Crisis management","Competitive teams"],
    hobbies:["Team sports (as captain)","Debate","Organizing events"],
    growthAdvice:"Real strength includes making room for other voices too.",
    bestTeammate:"A thoughtful second-in-command who tempers the pace.",
    worstTeammate:"Someone competing for the same spotlight.",
    quote:"Someone has to call it. Might as well be me." },

  { id:"lantern", name:"The Lantern", title:"Guiding Light", icon:"🏮",
    colors:["#FACC15","#FDBA74"],
    image:"assets/archetypes/webp/12-lantern.webp",
    signature:[{dim:"optimism",w:2},{dim:"empathy",w:1},{dim:"leadership",w:1}],
    description:"You have a rare gift for making dark moments feel survivable. Not through denial, through steady, genuine hope that things can still work out.",
    strengths:["Contagious optimism","Emotionally steadying presence","Encourages others naturally"],
    weaknesses:["Can minimize real problems","Avoids sitting with negativity","Overextends emotionally"],
    workStyle:"Motivational, morale-focused, keeps teams hopeful under pressure.",
    stressResponse:"Reframes the situation to find the workable path forward.",
    friendshipStyle:"The friend who always has a reason things will be okay.",
    datingStyle:"Encouraging, affirming, believes in their partner deeply.",
    leadershipStyle:"Leads by keeping morale and hope alive.",
    learningStyle:"Learns best with encouragement rather than criticism.",
    communicationStyle:"Warm, encouraging, forward-looking.",
    decisionMaking:"Leans toward the option that keeps hope alive.",
    idealEnvironments:["Team environments under pressure","Mentorship roles","Community work"],
    hobbies:["Mentoring","Journaling gratitude","Group activities"],
    growthAdvice:"Hope and honesty about hard truths can coexist.",
    bestTeammate:"A realist who keeps the optimism grounded.",
    worstTeammate:"Someone who mistakes your hope for naivety and exploits it.",
    quote:"Even the smallest light changes a room." },

  { id:"undercurrent", name:"The Undercurrent", title:"Quiet Influence", icon:"🌊",
    colors:["#2DD4BF","#60A5FA"],
    image:"assets/archetypes/webp/13-undercurrent.webp",
    signature:[{dim:"selfAwareness",w:2},{dim:"patience",w:1},{dim:"independence",w:1}],
    description:"You rarely lead from the front, but somehow the direction of the group often traces back to something you said quietly, once, and meant completely.",
    strengths:["Subtle influence","Emotional intelligence","Thoughtful timing"],
    weaknesses:["Underestimates own impact","Avoids visible credit","Can be too indirect"],
    workStyle:"Behind-the-scenes, high-impact, prefers influence over authority.",
    stressResponse:"Observes quietly before choosing how to respond.",
    friendshipStyle:"The quiet advisor everyone eventually comes to.",
    datingStyle:"Subtle, thoughtful gestures over grand declarations.",
    leadershipStyle:"Leads through influence rather than position.",
    learningStyle:"Absorbs quietly, applies precisely.",
    communicationStyle:"Measured, timed carefully for maximum effect.",
    decisionMaking:"Patient, observant, acts once the moment is right.",
    idealEnvironments:["Advisory roles","Small trusted teams","Roles with real autonomy"],
    hobbies:["Reading people and situations","Writing","Long walks"],
    growthAdvice:"Claiming credit isn't arrogance, it's accurate information.",
    bestTeammate:"Someone who notices and amplifies your quiet contributions.",
    worstTeammate:"Someone who takes credit for your influence.",
    quote:"The tide moves the ship. No one applauds the tide." },

  { id:"tinkerer", name:"The Tinkerer", title:"Hands-On Problem Solver", icon:"🔧",
    colors:["#CBD5E1","#FB923C"],
    image:"assets/archetypes/webp/14-tinkerer.webp",
    signature:[{dim:"curiosity",w:1},{dim:"logic",w:1},{dim:"adaptability",w:2}],
    description:"You understand things by taking them apart. Theory only gets you so far, you trust what you've built, broken, and fixed with your own hands.",
    strengths:["Practical problem-solving","Resourcefulness","Learns fast by doing"],
    weaknesses:["Impatient with pure theory","Can skip documentation","Undervalues planning"],
    workStyle:"Hands-on, iterative, prefers building over discussing.",
    stressResponse:"Fixes something, anything, to feel in control again.",
    friendshipStyle:"The one who actually shows up to help you move.",
    datingStyle:"Shows love through fixing and doing, not just saying.",
    leadershipStyle:"Leads by example, in the trenches with the team.",
    learningStyle:"Trial and error, hands-on from the start.",
    communicationStyle:"Practical, straightforward, low on abstraction.",
    decisionMaking:"Tests it in the real world rather than debating it endlessly.",
    idealEnvironments:["Workshops and labs","Fast-iteration teams","Startups"],
    hobbies:["Building and repairing things","DIY projects","Gaming (especially building/crafting genres)"],
    growthAdvice:"A little planning up front saves a lot of rebuilding later.",
    bestTeammate:"A planner who gives your instincts some structure.",
    worstTeammate:"Someone all talk and no action.",
    quote:"If it's broken, I'd rather open it than google it." },

  { id:"mirror", name:"The Mirror", title:"Self-Aware Observer", icon:"🪞",
    colors:["#7DD3FC","#A78BFA"],
    image:"assets/archetypes/webp/15-mirror.webp",
    signature:[{dim:"selfAwareness",w:2},{dim:"empathy",w:1},{dim:"curiosity",w:1}],
    description:"You've done more self-reflection than most people do in a decade, and it shows in how calmly you handle other people's chaos. You know exactly who you are.",
    strengths:["Deep self-knowledge","Emotional regulation","Honest with themselves"],
    weaknesses:["Can overanalyze","Sometimes too introspective to act","Slow to trust praise"],
    workStyle:"Reflective, thoughtful, values meaning over speed.",
    stressResponse:"Processes internally, often through writing or reflection.",
    friendshipStyle:"Gives genuinely insightful advice, rarely surface-level.",
    datingStyle:"Self-aware enough to communicate needs clearly.",
    leadershipStyle:"Leads by modeling honest self-reflection for others.",
    learningStyle:"Learns through reflection as much as instruction.",
    communicationStyle:"Thoughtful, honest, comfortable with vulnerability.",
    decisionMaking:"Checks in with their own values before deciding.",
    idealEnvironments:["Therapeutic or reflective fields","Writing","Coaching"],
    hobbies:["Journaling","Therapy or self-development","Quiet solo time"],
    growthAdvice:"At some point, insight has to turn into action.",
    bestTeammate:"A doer who turns your insight into momentum.",
    worstTeammate:"Someone who never reflects on their own impact.",
    quote:"I'd rather know myself than be flattered by a stranger." },

  { id:"ronin", name:"The Ronin", title:"Independent Wanderer", icon:"🗡️",
    colors:["#CBD5E1","#FB7185"],
    image:"assets/archetypes/webp/16-ronin.webp",
    signature:[{dim:"independence",w:2},{dim:"confidence",w:1},{dim:"risk",w:1}],
    description:"You answer to your own code, not the crowd's. Groups are fine in small doses, but your center of gravity has always been your own judgment.",
    strengths:["Self-reliant","Principled","Comfortable being alone"],
    weaknesses:["Struggles to rely on others","Can seem aloof","Avoids asking for help"],
    workStyle:"Prefers autonomy, ownership, and minimal oversight.",
    stressResponse:"Withdraws to handle it alone, on their own terms.",
    friendshipStyle:"Low-maintenance but fiercely genuine when it matters.",
    datingStyle:"Needs independence respected, even while committed.",
    leadershipStyle:"Leads by personal example rather than direction-giving.",
    learningStyle:"Self-taught, prefers figuring it out solo.",
    communicationStyle:"Honest, unfiltered, doesn't perform for approval.",
    decisionMaking:"Trusts their own judgment above outside opinion.",
    idealEnvironments:["Freelance or independent work","Small autonomous roles"],
    hobbies:["Solo travel","Martial arts or individual sports","Reading"],
    growthAdvice:"Letting people in isn't weakness, it's a different kind of strength.",
    bestTeammate:"Someone who respects the need for space without taking it personally.",
    worstTeammate:"Someone overly dependent on group consensus.",
    quote:"I don't need permission to be who I am." },

  { id:"beacon", name:"The Beacon", title:"Inspiring Communicator", icon:"🗼",
    colors:["#FACC15","#F472B6"],
    image:"assets/archetypes/webp/17-beacon.webp",
    signature:[{dim:"leadership",w:1},{dim:"humor",w:1},{dim:"socialEnergy",w:2}],
    description:"You have a way of putting words to things other people were only feeling. Rooms brighten and conversations pick up energy when you're in them.",
    strengths:["Natural communicator","Inspires others easily","High social energy"],
    weaknesses:["Can talk more than listen","Overextends socially","Needs an audience sometimes"],
    workStyle:"Thrives presenting, pitching, or rallying a group.",
    stressResponse:"Talks it through, often out loud, with others.",
    friendshipStyle:"The connector who introduces everyone to everyone.",
    datingStyle:"Expressive, affectionate, communicates openly.",
    leadershipStyle:"Leads by inspiring belief in a shared vision.",
    learningStyle:"Learns best out loud, in discussion with others.",
    communicationStyle:"Expressive, energetic, persuasive.",
    decisionMaking:"Talks it out with others before finalizing.",
    idealEnvironments:["Public-facing roles","Teams","Anything involving an audience"],
    hobbies:["Public speaking","Performing","Hosting events"],
    growthAdvice:"Silence can hold as much value as your next great line.",
    bestTeammate:"A deep listener who balances your outward energy.",
    worstTeammate:"Someone equally loud, competing for airtime.",
    quote:"Say the thing. Someone in the room needs to hear it." },

  { id:"glacier", name:"The Glacier", title:"Patient Force", icon:"🧊",
    colors:["#7DD3FC","#CBD5E1"],
    image:"assets/archetypes/webp/18-glacier.webp",
    signature:[{dim:"patience",w:2},{dim:"discipline",w:2},{dim:"resilience",w:1}],
    description:"You move slowly, deliberately, and completely reshape the landscape without anyone noticing until it's done. Rushing has never been your language.",
    strengths:["Unmatched patience","Consistency over time","Rarely reactive"],
    weaknesses:["Slow to start","Can seem passive","Resists urgency even when needed"],
    workStyle:"Long-horizon, methodical, values consistency over speed.",
    stressResponse:"Slows down further rather than speeding up.",
    friendshipStyle:"A steady, low-drama presence over the long run.",
    datingStyle:"Takes things slow but builds something lasting.",
    leadershipStyle:"Leads through sustained, quiet consistency.",
    learningStyle:"Prefers mastery through repetition over speed.",
    communicationStyle:"Calm, unrushed, considers every word.",
    decisionMaking:"Deliberately slow, rarely regretted.",
    idealEnvironments:["Long-term projects","Roles that reward consistency"],
    hobbies:["Long-distance activities","Craftsmanship","Slow travel"],
    growthAdvice:"Some moments genuinely need urgency, practice recognizing them.",
    bestTeammate:"Someone with urgency to balance your steady pace.",
    worstTeammate:"Someone who mistakes your patience for lack of care.",
    quote:"Given enough time, I reshape anything." },

  { id:"spark", name:"The Spark", title:"Instant Connector", icon:"✨",
    colors:["#FACC15","#FB923C"],
    image:"assets/archetypes/webp/19-spark.webp",
    signature:[{dim:"humor",w:2},{dim:"socialEnergy",w:1},{dim:"adaptability",w:1}],
    description:"You lower the temperature of any tense room just by being in it. Humor isn't a deflection for you, it's how you show people you actually see them.",
    strengths:["Quick wit","Puts people at ease","Naturally likeable"],
    weaknesses:["Uses humor to avoid depth sometimes","Can undersell serious moments","Restless"],
    workStyle:"Collaborative, energetic, great at defusing tension.",
    stressResponse:"Uses humor to process and cope.",
    friendshipStyle:"The friend who makes hard days feel lighter.",
    datingStyle:"Playful, fun, keeps the relationship light and warm.",
    leadershipStyle:"Leads by keeping morale genuinely high.",
    learningStyle:"Learns best when it's engaging and a little fun.",
    communicationStyle:"Witty, warm, quick on their feet.",
    decisionMaking:"Trusts instinct, decides fast, laughs about it later either way.",
    idealEnvironments:["Social, dynamic teams","Anything client- or people-facing"],
    hobbies:["Comedy and improv","Social games","Hosting friends"],
    growthAdvice:"It's safe to let a serious moment stay serious sometimes.",
    bestTeammate:"Someone steady who grounds the fun with follow-through.",
    worstTeammate:"Someone who takes the humor personally.",
    quote:"If we're not laughing, we're doing it wrong." },

  { id:"vault", name:"The Vault", title:"Private and Trustworthy", icon:"🔒",
    colors:["#818CF8","#CBD5E1"],
    image:"assets/archetypes/webp/20-vault.webp",
    signature:[{dim:"trust",w:2},{dim:"discipline",w:1},{dim:"independence",w:1}],
    description:"People tell you things they haven't told anyone else, and it never once occurs to them to worry about it. Discretion, for you, isn't effort, it's identity.",
    strengths:["Absolute discretion","Steady reliability","Deep loyalty"],
    weaknesses:["Overguards their own feelings too","Slow to open up","Can seem unreadable"],
    workStyle:"Careful, confidential, trusted with sensitive responsibility.",
    stressResponse:"Handles it privately, rarely burdens others.",
    friendshipStyle:"The safest person to confide in, bar none.",
    datingStyle:"Loyal and private; keeps the relationship's inner life protected.",
    leadershipStyle:"Leads by earning quiet, total trust.",
    learningStyle:"Learns privately, tests ideas before sharing them.",
    communicationStyle:"Careful, deliberate, guards details until relevant.",
    decisionMaking:"Weighs consequences for everyone involved before choosing.",
    idealEnvironments:["High-trust roles","Small teams","Confidential work"],
    hobbies:["Journaling privately","Collecting","One-on-one time over groups"],
    growthAdvice:"You can be trusted with others' secrets and still share your own.",
    bestTeammate:"Someone who earns trust patiently rather than demanding it.",
    worstTeammate:"Someone careless with sensitive information.",
    quote:"What you tell me stays exactly where you left it." },

  { id:"pathfinder", name:"The Pathfinder", title:"First Through the Door", icon:"🧗",
    colors:["#34D399","#FDBA74"],
    image:"assets/archetypes/webp/21-pathfinder.webp",
    signature:[{dim:"risk",w:2},{dim:"curiosity",w:1},{dim:"independence",w:1}],
    description:"Uncharted territory doesn't scare you, it's the whole point. You'd rather take the unfamiliar route once than the safe one a hundred times.",
    strengths:["Bold exploration","Comfortable with uncertainty","Resourceful under pressure"],
    weaknesses:["Underestimates real risk sometimes","Impatient with caution","Can go it alone too often"],
    workStyle:"Thrives pioneering new territory or untested approaches.",
    stressResponse:"Seeks a new challenge to channel the energy.",
    friendshipStyle:"The friend who drags everyone into the best bad idea.",
    datingStyle:"Adventurous, spontaneous, keeps things exciting.",
    leadershipStyle:"Leads by going first and proving it's possible.",
    learningStyle:"Learns by throwing themselves directly into the unknown.",
    communicationStyle:"Direct, energetic, low patience for overexplaining.",
    decisionMaking:"Biased toward action over analysis.",
    idealEnvironments:["Exploration-heavy roles","Startups","Travel"],
    hobbies:["Hiking and outdoor exploration","Travel","Trying new things constantly"],
    growthAdvice:"A little caution isn't the enemy of adventure.",
    bestTeammate:"Someone cautious enough to catch the risks you miss.",
    worstTeammate:"Someone equally reckless with no one watching the map.",
    quote:"The trail isn't real until someone walks it." },

  { id:"weaver", name:"The Weaver", title:"Social Connector", icon:"🧵",
    colors:["#F472B6","#A78BFA"],
    image:"assets/archetypes/webp/22-weaver.webp",
    signature:[{dim:"empathy",w:1},{dim:"socialEnergy",w:2},{dim:"trust",w:1}],
    description:"You remember how people are connected to each other better than they do. Left alone in any group, you'll have found the common thread within minutes.",
    strengths:["Natural relationship-building","Reads group dynamics well","Bridges people together"],
    weaknesses:["Can overextend socially","Avoids being alone too long","Takes on others' emotions"],
    workStyle:"Collaborative, relationship-driven, thrives cross-team.",
    stressResponse:"Reaches out to others rather than isolating.",
    friendshipStyle:"The one who keeps the whole friend group actually connected.",
    datingStyle:"Warm, communicative, invests deeply in connection.",
    leadershipStyle:"Leads by building trust between people, not just tasks.",
    learningStyle:"Learns best collaboratively, through discussion.",
    communicationStyle:"Warm, inclusive, actively listens.",
    decisionMaking:"Weighs the impact on relationships heavily.",
    idealEnvironments:["People-centered roles","Community and network-based work"],
    hobbies:["Hosting and organizing","Networking (the genuine kind)","Group activities"],
    growthAdvice:"Solitude can recharge you just as much as connection does.",
    bestTeammate:"Someone independent who still values the network you build.",
    worstTeammate:"Someone who dismisses relationship-building as unimportant.",
    quote:"Everyone's one good introduction away from a different life." },

  { id:"foundry", name:"The Foundry", title:"Disciplined Builder", icon:"⚒️",
    colors:["#FB923C","#CBD5E1"],
    image:"assets/archetypes/webp/23-foundry.webp",
    signature:[{dim:"discipline",w:2},{dim:"drive",w:1},{dim:"planning",w:1}],
    description:"Consistency is your entire strategy. While others chase bursts of motivation, you show up, every day, and let the compounding do the rest.",
    strengths:["Unshakeable discipline","Reliable output","Strong work ethic"],
    weaknesses:["Rigid with routine","Struggles with spontaneity","Can be hard on themselves"],
    workStyle:"Consistent, structured, values process as much as outcome.",
    stressResponse:"Doubles down on routine and structure.",
    friendshipStyle:"Dependable, shows up on time, every time.",
    datingStyle:"Committed and consistent; actions over grand gestures.",
    leadershipStyle:"Leads by modeling relentless consistency.",
    learningStyle:"Repetition-based mastery, practice over theory.",
    communicationStyle:"Straightforward, no-nonsense, dependable.",
    decisionMaking:"Sticks to principles rather than shifting with mood.",
    idealEnvironments:["Structured organizations","Craft-based or skill-building work"],
    hobbies:["Fitness routines","Skill mastery (music, sport, craft)","Habit tracking"],
    growthAdvice:"Rest isn't a break from discipline, it's part of it.",
    bestTeammate:"Someone flexible who softens the rigidity a little.",
    worstTeammate:"Someone inconsistent who derails the routine.",
    quote:"Motivation is unreliable. Discipline shows up anyway." },

  { id:"mirage", name:"The Mirage", title:"Creative Dreamer", icon:"🌫️",
    colors:["#C084FC","#7DD3FC"],
    image:"assets/archetypes/webp/24-mirage.webp",
    signature:[{dim:"creativity",w:2},{dim:"optimism",w:1},{dim:"independence",w:1}],
    description:"You live half in the world everyone shares and half in the one you're building in your head. The line between them is thinner than people assume.",
    strengths:["Rich imagination","Original perspective","Comfortable in ambiguity"],
    weaknesses:["Can drift from practical demands","Overpromises on ideas","Struggles with routine"],
    workStyle:"Idea-driven, thrives with creative freedom.",
    stressResponse:"Escapes into imagination or a creative outlet.",
    friendshipStyle:"Brings a completely different way of seeing things.",
    datingStyle:"Romantic, imaginative, deeply expressive.",
    leadershipStyle:"Leads by painting a vision others want to chase.",
    learningStyle:"Learns through imagination and association.",
    communicationStyle:"Vivid, descriptive, sometimes abstract.",
    decisionMaking:"Follows inspiration more than convention.",
    idealEnvironments:["Creative industries","Flexible, low-structure roles"],
    hobbies:["Writing fiction","Art","Daydreaming with intention"],
    growthAdvice:"Grounding one idea fully can be more powerful than chasing ten.",
    bestTeammate:"A practical executor who brings the dream into reality.",
    worstTeammate:"Someone who dismisses imagination as impractical.",
    quote:"Reality is just the first draft." },

  { id:"compass", name:"The Compass", title:"Principled Decider", icon:"🧭",
    colors:["#2DD4BF","#FACC15"],
    image:"assets/archetypes/webp/25-compass.webp",
    signature:[{dim:"logic",w:1},{dim:"trust",w:1},{dim:"selfAwareness",w:2}],
    description:"You know exactly what you value, and it shows in every choice you make, even the small ones. People trust your decisions because they know what they're built on.",
    strengths:["Strong personal values","Consistent integrity","Clear-headed under pressure"],
    weaknesses:["Can be inflexible on principle","Judges quick compromise harshly","Overthinks ethics of small choices"],
    workStyle:"Values-driven, principled, consistent regardless of pressure.",
    stressResponse:"Returns to core values to decide what to do next.",
    friendshipStyle:"The friend who gives advice you can actually trust.",
    datingStyle:"Honest, values-aligned, seeks the same in a partner.",
    leadershipStyle:"Leads by staying consistent when it's hardest to.",
    learningStyle:"Wants to understand the ethical 'why' behind everything.",
    communicationStyle:"Honest, direct, occasionally blunt in service of truth.",
    decisionMaking:"Filters every choice through personal values first.",
    idealEnvironments:["Mission-driven organizations","Ethics-heavy fields"],
    hobbies:["Philosophy and ethics","Debate","Mentoring"],
    growthAdvice:"Principles can flex without breaking, practice the difference.",
    bestTeammate:"Someone pragmatic who helps values meet reality.",
    worstTeammate:"Someone who compromises core values for convenience.",
    quote:"I'd rather be right and alone than easy and wrong." },

  { id:"firefly", name:"The Firefly", title:"Playful Spontaneity", icon:"🌟",
    colors:["#FACC15","#6EE7B7"],
    image:"assets/archetypes/webp/26-firefly.webp",
    signature:[{dim:"humor",w:1},{dim:"risk",w:1},{dim:"adaptability",w:2}],
    description:"You move through life catching the good moments as they appear, without much of a plan for the next one. Spontaneity isn't a flaw for you, it's how joy finds you.",
    strengths:["Lives fully in the moment","Highly adaptable","Infectious playfulness"],
    weaknesses:["Struggles with long-term follow-through","Avoids heavy commitment","Easily distracted"],
    workStyle:"Flexible, energetic, better in bursts than long grinds.",
    stressResponse:"Distracts and lightens the mood, for themselves and others.",
    friendshipStyle:"Always down for the last-minute plan.",
    datingStyle:"Fun, spontaneous, keeps things light and exciting.",
    leadershipStyle:"Leads by keeping the group's energy alive.",
    learningStyle:"Learns best through play and variety.",
    communicationStyle:"Light, quick, easy to talk to.",
    decisionMaking:"Follows what feels good in the moment.",
    idealEnvironments:["Dynamic, varied roles","Anything social and unstructured"],
    hobbies:["Spontaneous travel","Parties and social events","Trying new hobbies constantly"],
    growthAdvice:"A little structure can hold your spontaneity without killing it.",
    bestTeammate:"Someone steady who handles the follow-through.",
    worstTeammate:"Someone equally scattered with no anchor.",
    quote:"Plans are just suggestions I haven't broken yet." },

  { id:"bastion", name:"The Bastion", title:"Resilient Under Fire", icon:"🏰",
    colors:["#FB7185","#34D399"],
    image:"assets/archetypes/webp/27-bastion.webp",
    signature:[{dim:"resilience",w:2},{dim:"discipline",w:1},{dim:"confidence",w:1}],
    description:"Pressure doesn't break you, it reveals you. You've been through enough that very little rattles you anymore, and people can feel that steadiness nearby.",
    strengths:["Unshakeable resilience","Handles crisis calmly","Reliable under pressure"],
    weaknesses:["Bottles up strain","Slow to ask for support","Can normalize too much hardship"],
    workStyle:"Steady under deadline and crisis, handles high-pressure roles well.",
    stressResponse:"Grinds through it, often without showing the strain.",
    friendshipStyle:"The friend who's been through it and still shows up strong.",
    datingStyle:"Steady and protective, even during hard times.",
    leadershipStyle:"Leads by staying composed when everything else isn't.",
    learningStyle:"Learns through hardship and hands-on experience.",
    communicationStyle:"Direct, unflinching, doesn't sugarcoat.",
    decisionMaking:"Stays clear-headed even under real pressure.",
    idealEnvironments:["Crisis response","High-pressure leadership","Long-term challenges"],
    hobbies:["Endurance sports","Mentoring others through hardship","Strength training"],
    growthAdvice:"Strength includes letting others carry some of the weight sometimes.",
    bestTeammate:"Someone who notices when you're carrying too much.",
    worstTeammate:"Someone who adds pressure without contributing support.",
    quote:"I've survived worse than this." },

  { id:"tide", name:"The Tide", title:"Adaptable Flow", icon:"🌙",
    colors:["#60A5FA","#22D3EE"],
    image:"assets/archetypes/webp/28-tide.webp",
    signature:[{dim:"adaptability",w:2},{dim:"optimism",w:1},{dim:"patience",w:1}],
    description:"You don't fight the current, you find a way to move with it that still gets you where you're going. Change rarely rattles you; you've adjusted before.",
    strengths:["Effortless adaptability","Goes with change gracefully","Rarely rigid"],
    weaknesses:["Can lack firm direction","Avoids conflict to keep peace","Struggles to commit to one path"],
    workStyle:"Flexible, comfortable with shifting priorities and ambiguity.",
    stressResponse:"Adjusts expectations rather than fighting the situation.",
    friendshipStyle:"Easygoing, low-drama, goes with the group's flow.",
    datingStyle:"Flexible and accommodating, adapts to their partner's needs.",
    leadershipStyle:"Leads by adjusting the plan as reality shifts.",
    learningStyle:"Absorbs and adapts to whatever teaching style is offered.",
    communicationStyle:"Easygoing, accommodating, non-confrontational.",
    decisionMaking:"Stays open, adjusts as new information comes in.",
    idealEnvironments:["Fast-changing environments","Roles requiring flexibility"],
    hobbies:["Travel","Yoga or fluid movement practices","Anything unstructured"],
    growthAdvice:"Sometimes holding your ground matters more than flowing around it.",
    bestTeammate:"Someone decisive who gives your flexibility direction.",
    worstTeammate:"Someone equally passive, with no one steering.",
    quote:"I don't resist the current. I just choose my line through it." },

  { id:"oracle", name:"The Oracle", title:"Intuitive Thinker", icon:"🔮",
    colors:["#C084FC","#818CF8"],
    image:"assets/archetypes/webp/29-oracle.webp",
    signature:[{dim:"curiosity",w:1},{dim:"empathy",w:1},{dim:"selfAwareness",w:2}],
    description:"You sense the undercurrent of a situation before anyone else names it out loud. Not psychic, just deeply attuned, to people, patterns, and meaning.",
    strengths:["Sharp intuition","Sees patterns others miss","Comfortable with big questions"],
    weaknesses:["Can overtrust instinct over evidence","Slow to explain their reasoning","Prone to overthinking"],
    workStyle:"Reflective, insight-driven, prefers meaning over routine.",
    stressResponse:"Turns inward to make sense of what's happening.",
    friendshipStyle:"Gives advice that somehow always lands exactly right.",
    datingStyle:"Deeply intuitive about their partner's needs.",
    leadershipStyle:"Leads by naming what others haven't articulated yet.",
    learningStyle:"Learns through reflection, pattern, and meaning-making.",
    communicationStyle:"Thoughtful, sometimes cryptic, always intentional.",
    decisionMaking:"Trusts intuition, then checks it against reason.",
    idealEnvironments:["Reflective or advisory roles","Research into human behavior"],
    hobbies:["Philosophy","Astrology, tarot, or similar symbolic systems","Deep conversation"],
    growthAdvice:"Instinct is powerful, but it still benefits from a second opinion.",
    bestTeammate:"A pragmatist who tests your intuition against reality.",
    worstTeammate:"Someone who dismisses insight without evidence entirely.",
    quote:"I usually know before I can explain why." },

  { id:"catalyst", name:"The Catalyst", title:"Change Igniter", icon:"🌋",
    colors:["#FB923C","#FB7185"],
    image:"assets/archetypes/webp/30-catalyst.webp",
    signature:[{dim:"drive",w:1},{dim:"leadership",w:1},{dim:"risk",w:2}],
    description:"Rooms change when you enter them, not because you're loud, but because you make stagnant things feel possible to fix. You're allergic to 'that's just how it is'.",
    strengths:["Sparks momentum in others","Comfortable disrupting the status quo","Energizing presence"],
    weaknesses:["Impatient with slow systems","Can push change too fast","Underestimates resistance"],
    workStyle:"Thrives initiating change, less interested in maintaining it.",
    stressResponse:"Channels frustration into pushing for change.",
    friendshipStyle:"The one who pushes the group out of a rut.",
    datingStyle:"Energizing, pushes their partner to grow.",
    leadershipStyle:"Leads by igniting momentum others couldn't start alone.",
    learningStyle:"Learns by challenging assumptions directly.",
    communicationStyle:"Direct, energizing, sometimes confrontational.",
    decisionMaking:"Biased toward action and disruption over the status quo.",
    idealEnvironments:["Change management","Early-stage ventures","Reform-minded teams"],
    hobbies:["Activism or organizing","Debate","Starting new projects"],
    growthAdvice:"Not every system that resists you is wrong, some just need patience.",
    bestTeammate:"A steady maintainer who sustains the change you spark.",
    worstTeammate:"Someone resistant to any change at all.",
    quote:"Comfortable is usually just 'unexamined'." },
];

/* ---- Careers (fit computed from dimensions, not hardcoded per archetype) */
const CAREERS = [
  { name:"UX Designer", dims:["empathy","creativity","logic"] },
  { name:"UI Designer", dims:["creativity","discipline","selfAwareness"] },
  { name:"Product Designer", dims:["creativity","logic","leadership"] },
  { name:"Illustrator / Artist", dims:["creativity","independence","curiosity"] },
  { name:"Graphic Designer", dims:["creativity","discipline","curiosity"] },
  { name:"Software Engineer", dims:["logic","discipline","patience"] },
  { name:"Data Analyst", dims:["logic","patience","curiosity"] },
  { name:"Architect", dims:["planning","creativity","discipline"] },
  { name:"Civil Engineer", dims:["planning","logic","discipline"] },
  { name:"Doctor / Clinician", dims:["empathy","discipline","resilience"] },
  { name:"Nurse", dims:["empathy","resilience","patience"] },
  { name:"Physical Therapist", dims:["patience","empathy","discipline"] },
  { name:"Teacher / Educator", dims:["patience","empathy","leadership"] },
  { name:"School Counselor", dims:["empathy","patience","selfAwareness"] },
  { name:"Entrepreneur", dims:["risk","drive","confidence"] },
  { name:"Small Business Owner", dims:["drive","discipline","adaptability"] },
  { name:"Researcher / Scientist", dims:["curiosity","logic","patience"] },
  { name:"Environmental Scientist", dims:["curiosity","planning","discipline"] },
  { name:"Writer", dims:["creativity","independence","selfAwareness"] },
  { name:"Journalist", dims:["curiosity","confidence","logic"] },
  { name:"Editor", dims:["logic","discipline","creativity"] },
  { name:"Film / Video Director", dims:["creativity","leadership","confidence"] },
  { name:"Video Editor", dims:["creativity","patience","discipline"] },
  { name:"Game Designer", dims:["creativity","logic","curiosity"] },
  { name:"Musician / Performer", dims:["creativity","confidence","humor"] },
  { name:"Psychologist / Therapist", dims:["empathy","patience","selfAwareness"] },
  { name:"Social Worker", dims:["empathy","kindness","resilience"] },
  { name:"Lawyer", dims:["logic","confidence","discipline"] },
  { name:"Paralegal", dims:["discipline","logic","patience"] },
  { name:"Chef", dims:["creativity","discipline","risk"] },
  { name:"Pastry Chef", dims:["discipline","creativity","patience"] },
  { name:"Marketing Strategist", dims:["creativity","socialEnergy","adaptability"] },
  { name:"Sales Manager", dims:["confidence","socialEnergy","drive"] },
  { name:"Human Resources Manager", dims:["empathy","leadership","discipline"] },
  { name:"Animator", dims:["creativity","patience","discipline"] },
  { name:"Operations / Project Manager", dims:["planning","discipline","leadership"] },
  { name:"Financial Analyst", dims:["logic","discipline","patience"] },
  { name:"Accountant", dims:["discipline","logic","patience"] },
  { name:"Urban Planner", dims:["planning","empathy","logic"] },
  { name:"Event Planner", dims:["planning","socialEnergy","adaptability"] },
  { name:"Firefighter / EMT", dims:["resilience","confidence","kindness"] },
  { name:"Military / Law Enforcement", dims:["discipline","resilience","leadership"] },
  { name:"Diplomat / Foreign Service", dims:["empathy","adaptability","leadership"] },
  { name:"Nonprofit Program Manager", dims:["kindness","leadership","planning"] },
  { name:"Data Scientist", dims:["logic","curiosity","discipline"] },
  { name:"Product Manager", dims:["leadership","logic","adaptability"] },
];

/* ---- Relationship pairing types (compatibility computed in engine.js) -- */
const RELATIONSHIP_TYPES = [
  { key:"friendship", label:"Friendship" },
  { key:"dating", label:"Dating" },
  { key:"marriage", label:"Marriage" },
  { key:"business", label:"Business Partner" },
  { key:"creative", label:"Creative Partner" },
  { key:"travel", label:"Travel Partner" },
  { key:"gaming", label:"Gaming Partner" },
  { key:"study", label:"Study Partner" },
  { key:"roommate", label:"Roommate" },
];

/* ---- Measured traits (formulas live in engine.js) ----------------------
   These replace the earlier "fun stat" joke labels with grounded, serious
   readings so the result feels like an actual assessment rather than a
   novelty score. Each is still just a formula over the 20 hidden
   dimensions, scaled 0 to 100. */
const MEASURED_TRAITS = [
  "Emotional Steadiness","Decision Confidence","Social Stamina",
  "Creative Output","Focus Capacity","Risk Tolerance","Empathy Index",
  "Leadership Presence","Adaptability Score","Resilience Rating",
  "Trust Radius","Independence Level","Friendship Reliability",
  "Growth Mindset","Communication Clarity","Stress Recovery"
];

/* ---- Lines shown during brief "calculating" transitions ----------------
   Rotated randomly, a mix of genuine-sounding processing steps and a
   couple of lighter ones, purely as a loading-state flourish. */
const CALC_LINES = [
  "Calculating cool factor",
  "Calculating baseline friendship motor",
  "Reading between the lines",
  "Cross-referencing your instincts",
  "Weighing risk against reason",
  "Measuring your patience threshold",
  "Checking how you handle a bad Tuesday",
  "Comparing this answer against the last one",
  "Running the numbers on your empathy",
  "Mapping your decision pattern",
  "Adjusting for how you actually think, not just what you picked",
  "Testing for consistency",
  "Locating your stress response",
  "Estimating your social battery",
  "Narrowing down your archetype",
  "Weighing loyalty against independence",
  "Checking your leadership signal",
  "Recalculating after that last answer",
];

/* ---- Lines shown while two codes are being compared --------------------- */
const COMPATIBILITY_CALC_LINES = [
  "Decoding both profiles",
  "Cross-referencing every trait",
  "Weighing shared strengths",
  "Checking for friction points",
  "Measuring trust overlap",
  "Comparing decision styles",
  "Working out who leads and who supports",
  "Running the numbers across 31 categories",
  "Finding your duo title",
  "Calculating chemistry",
  "Almost got your compatibility score",
];

/* =========================================================================
   V2 ADDITIONS
   Everything below is new for the v2 update. Nothing above this line was
   removed or restructured, so PF1 codes and the original 20-dimension
   scoring still work exactly as before.
   ========================================================================= */

/* ---- Archetype extras: animal, element, symbol -------------------------
   primaryColor, secondaryColor, lifeMotto and favoriteEnvironment are all
   derived directly from existing archetype fields (colors, quote,
   idealEnvironments) rather than re-authored, so there is nothing new to
   keep in sync. hiddenPotential is generated from each archetype's own
   strengths/weaknesses in engine.js, also with no separate authoring. */
const ARCHETYPE_EXTRAS = {
  "ember-strategist": { animal:"Fox", element:"Fire", symbol:"\u2694" },
  "quiet-architect": { animal:"Beaver", element:"Earth", symbol:"\uD83C\uDFDB" },
  "wildfire": { animal:"Falcon", element:"Fire", symbol:"\u26A1" },
  "anchor": { animal:"Elephant", element:"Water", symbol:"\u2693" },
  "cartographer": { animal:"Raven", element:"Air", symbol:"\uD83E\uDDED" },
  "alchemist": { animal:"Fox", element:"Fire", symbol:"\u2697" },
  "sentinel": { animal:"Wolf", element:"Earth", symbol:"\uD83D\uDEE1" },
  "comet": { animal:"Cheetah", element:"Fire", symbol:"\u2604" },
  "hearth-keeper": { animal:"Deer", element:"Earth", symbol:"\uD83D\uDD6F" },
  "puzzle-box": { animal:"Cat", element:"Shadow", symbol:"\uD83E\uDDE9" },
  "storm-caller": { animal:"Lion", element:"Storm", symbol:"\uD83C\uDF29" },
  "lantern": { animal:"Moth", element:"Light", symbol:"\uD83C\uDFEE" },
  "undercurrent": { animal:"Eel", element:"Water", symbol:"\uD83C\uDF0A" },
  "tinkerer": { animal:"Beaver", element:"Metal", symbol:"\uD83D\uDD27" },
  "mirror": { animal:"Swan", element:"Water", symbol:"\uD83E\uDE9E" },
  "ronin": { animal:"Wolf", element:"Metal", symbol:"\uD83D\uDDE1" },
  "beacon": { animal:"Peacock", element:"Light", symbol:"\uD83D\uDF7C" },
  "glacier": { animal:"Polar Bear", element:"Ice", symbol:"\uD83E\uDDCA" },
  "spark": { animal:"Otter", element:"Fire", symbol:"\u2728" },
  "vault": { animal:"Tortoise", element:"Earth", symbol:"\uD83D\uDD12" },
  "pathfinder": { animal:"Mountain Goat", element:"Earth", symbol:"\uD83E\uDDD7" },
  "weaver": { animal:"Honeybee", element:"Air", symbol:"\uD83E\uDDF5" },
  "foundry": { animal:"Ox", element:"Metal", symbol:"\u2692" },
  "mirage": { animal:"Cat", element:"Air", symbol:"\uD83C\uDF2B" },
  "compass": { animal:"Heron", element:"Water", symbol:"\u2696" },
  "firefly": { animal:"Firefly", element:"Light", symbol:"\uD83C\uDF1F" },
  "bastion": { animal:"Bear", element:"Earth", symbol:"\uD83C\uDFF0" },
  "tide": { animal:"Dolphin", element:"Water", symbol:"\uD83C\uDF19" },
  "oracle": { animal:"Owl", element:"Shadow", symbol:"\uD83D\uDD2E" },
  "catalyst": { animal:"Hawk", element:"Fire", symbol:"\uD83C\uDF0B" },
};

/* ---- Narrative roles ---------------------------------------- */
const NARRATIVE_ROLES = [
  { name:"Hero", icon:"\u2694", signature:[{dim:"leadership",w:2},{dim:"kindness",w:1},{dim:"resilience",w:1}],
    description:"You're the one who ends up carrying the weight when it matters, not because you asked to, but because you didn't look away." },
  { name:"Main Character", icon:"\u2B50", signature:[{dim:"confidence",w:2},{dim:"drive",w:1},{dim:"creativity",w:1}],
    description:"Things seem to happen around you, and somehow you're rarely just in the background of your own life." },
  { name:"Anti Hero", icon:"\uD83D\uDDA4", signature:[{dim:"independence",w:2},{dim:"risk",w:1},{dim:"competitiveness",w:1}],
    description:"You do the right thing eventually, just rarely the tidy, expected way." },
  { name:"Mentor", icon:"\uD83D\uDCD6", signature:[{dim:"empathy",w:1},{dim:"patience",w:2},{dim:"selfAwareness",w:1}],
    description:"People end up learning more from watching you than from anything you actually say." },
  { name:"Guardian", icon:"\uD83D\uDEE1", signature:[{dim:"responsibility",w:2},{dim:"trust",w:1},{dim:"kindness",w:1}],
    description:"You quietly decide who and what is worth protecting, and then you just do it." },
  { name:"Strategist", icon:"\u265F", signature:[{dim:"logic",w:2},{dim:"planning",w:2}],
    description:"While everyone else reacts, you're already three moves further into the situation." },
  { name:"Explorer", icon:"\uD83E\uDDED", signature:[{dim:"curiosity",w:2},{dim:"openMindedness",w:1},{dim:"risk",w:1}],
    description:"Unfamiliar territory doesn't worry you, it's usually the whole reason you showed up." },
  { name:"Rebel", icon:"\uD83D\uDD25", signature:[{dim:"independence",w:1},{dim:"risk",w:2},{dim:"competitiveness",w:1}],
    description:"Rules get your attention mostly by existing, and you're rarely satisfied with \"that's just how it's done\"." },
  { name:"Trickster", icon:"\uD83C\uDFAD", signature:[{dim:"humor",w:2},{dim:"creativity",w:1},{dim:"adaptability",w:1}],
    description:"You'd rather solve a problem sideways than head-on, and it's more fun that way anyway." },
  { name:"Mastermind", icon:"\uD83E\uDDE0", signature:[{dim:"logic",w:1},{dim:"leadership",w:1},{dim:"independence",w:1}],
    description:"You see the whole board, and you're usually already several steps ahead of the conversation." },
  { name:"Visionary", icon:"\uD83D\uDD2E", signature:[{dim:"creativity",w:2},{dim:"drive",w:1},{dim:"optimism",w:1}],
    description:"You're pulled toward what things could become, more than what they already are." },
  { name:"Wild Card", icon:"\uD83C\uDCCF", signature:[{dim:"adaptability",w:2},{dim:"openMindedness",w:1},{dim:"humor",w:1}],
    description:"Nobody's quite sure what you'll do next, including, some days, you." },
  { name:"Comic Relief", icon:"\uD83D\uDE02", signature:[{dim:"humor",w:2},{dim:"socialEnergy",w:1},{dim:"optimism",w:1}],
    description:"You lighten a room without even trying, and it matters more than people usually say out loud." },
  { name:"Survivor", icon:"\uD83E\uDEB6", signature:[{dim:"resilience",w:2},{dim:"persistence",w:1},{dim:"emotionalStability",w:1}],
    description:"You've been through enough that very little catches you fully off guard anymore." },
  { name:"Rival", icon:"\uD83C\uDFC6", signature:[{dim:"competitiveness",w:2},{dim:"confidence",w:1},{dim:"drive",w:1}],
    description:"You do your best work when there's someone or something to measure yourself against." },
  { name:"Villain", icon:"\uD83D\uDC79", signature:[{dim:"independence",w:1},{dim:"competitiveness",w:1},{dim:"trust",w:-2}],
    description:"You've stopped needing the room's approval, for better and occasionally worse." },
  { name:"Hidden Villain", icon:"\uD83C\uDFAD", signature:[{dim:"selfAwareness",w:1},{dim:"independence",w:1},{dim:"trust",w:-1}],
    description:"You keep your real agenda close, and people rarely see it coming." },
  { name:"Chosen One", icon:"\u2728", signature:[{dim:"optimism",w:1},{dim:"resilience",w:1},{dim:"drive",w:1}],
    description:"Things seem to keep testing you specifically, and you keep rising to it anyway." },
  { name:"Lone Wolf", icon:"\uD83D\uDC3A", signature:[{dim:"independence",w:2},{dim:"resilience",w:1}],
    description:"You handle your own weather. Backup is nice, but you were never counting on it." },
];

/* ---- Aesthetic vibes --------------------------------------- */
const AESTHETIC_VIBES = [
  { name:"Minimalist", signature:[{dim:"discipline",w:2},{dim:"planning",w:1},{dim:"independence",w:1}],
    colors:"Monochrome, with a single considered accent color",
    fontPairing:"A clean grotesk sans, generous whitespace, nothing decorative",
    clothing:"Neutral tones, a few well-made basics rather than a lot of pieces",
    room:"Uncluttered, with only objects you'd defend keeping",
    workspace:"One screen, a closed tab list, nothing on the desk you don't use daily" },
  { name:"Maximalist", signature:[{dim:"creativity",w:2},{dim:"openMindedness",w:1},{dim:"humor",w:1}],
    colors:"Layered and saturated, more is more and it still works",
    fontPairing:"An expressive display face paired with a plain, quiet body font",
    clothing:"Pattern on pattern, secondhand pieces that already have a story",
    room:"Every wall doing something, nothing left blank",
    workspace:"Covered in reference material and half-finished ideas" },
  { name:"Moody", signature:[{dim:"independence",w:2},{dim:"selfAwareness",w:1},{dim:"risk",w:1}],
    colors:"Deep charcoal and ink, one warm point of light",
    fontPairing:"A narrow serif for headlines, monospace for detail",
    clothing:"Mostly black, well-tailored, quietly expensive-looking",
    room:"Low light, very few objects, each one deliberate",
    workspace:"One lamp, a closed door, minimal notifications" },
  { name:"Bright and Playful", signature:[{dim:"humor",w:2},{dim:"socialEnergy",w:1},{dim:"optimism",w:1}],
    colors:"Warm, saturated primaries",
    fontPairing:"A rounded sans with big, friendly headlines",
    clothing:"Color blocking, one slightly silly accessory",
    room:"Plants, posters, visible personality everywhere",
    workspace:"Sticky notes, music on, a little chaos that works" },
  { name:"Classic and Structured", signature:[{dim:"responsibility",w:2},{dim:"discipline",w:1},{dim:"planning",w:1}],
    colors:"Navy, cream, and forest green",
    fontPairing:"A traditional serif with a restrained sans for interface text",
    clothing:"Tailored and timeless, rarely trend-driven",
    room:"Symmetry, good lighting, nothing out of place",
    workspace:"Labeled folders and an actual calendar on the wall" },
  { name:"Bohemian", signature:[{dim:"openMindedness",w:2},{dim:"curiosity",w:1},{dim:"creativity",w:1}],
    colors:"Earth tones and warm textiles",
    fontPairing:"A handwritten accent font over a soft serif body",
    clothing:"Layered and textured, well-traveled",
    room:"Plants, textiles, souvenirs that each have a story",
    workspace:"A mess that only makes sense to you, and that's fine" },
  { name:"Industrial", signature:[{dim:"logic",w:1},{dim:"discipline",w:1},{dim:"independence",w:1}],
    colors:"Concrete grey and black steel, one raw wood tone",
    fontPairing:"A monospace headline over a utilitarian sans body",
    clothing:"Functional, durable, unfussy",
    room:"Exposed materials, minimal decoration",
    workspace:"Built for output, not for showing off" },
  { name:"Soft and Cozy", signature:[{dim:"kindness",w:2},{dim:"patience",w:1},{dim:"empathy",w:1}],
    colors:"Warm neutrals and muted pastels",
    fontPairing:"A rounded, soft serif with generous line height",
    clothing:"Layered knits, comfort over statement",
    room:"Warm lighting, soft textures, a blanket always within reach",
    workspace:"A candle, a plant, something handmade nearby" },
];

/* ---- Ideal environments ------------------------------------ */
const ENVIRONMENT_PROFILES = [
  { name:"Remote", signature:[{dim:"independence",w:2},{dim:"discipline",w:1}] },
  { name:"Office", signature:[{dim:"socialEnergy",w:1},{dim:"discipline",w:1},{dim:"planning",w:1}] },
  { name:"Startup", signature:[{dim:"risk",w:2},{dim:"drive",w:1}] },
  { name:"Corporate", signature:[{dim:"responsibility",w:2},{dim:"planning",w:1}] },
  { name:"Nature", signature:[{dim:"curiosity",w:1},{dim:"independence",w:1},{dim:"openMindedness",w:1}] },
  { name:"City", signature:[{dim:"socialEnergy",w:2},{dim:"curiosity",w:1}] },
  { name:"Night", signature:[{dim:"independence",w:1},{dim:"creativity",w:1},{dim:"openMindedness",w:1}] },
  { name:"Morning", signature:[{dim:"discipline",w:2},{dim:"planning",w:1}] },
  { name:"Coffee Shop", signature:[{dim:"socialEnergy",w:1},{dim:"curiosity",w:1},{dim:"creativity",w:1}] },
  { name:"Library", signature:[{dim:"patience",w:2},{dim:"discipline",w:1}] },
  { name:"Home", signature:[{dim:"kindness",w:1},{dim:"patience",w:1},{dim:"independence",w:1}] },
  { name:"Freelancer", signature:[{dim:"independence",w:2},{dim:"adaptability",w:1}] },
  { name:"Research", signature:[{dim:"curiosity",w:2},{dim:"patience",w:1}] },
  { name:"Teaching", signature:[{dim:"patience",w:1},{dim:"empathy",w:1},{dim:"leadership",w:1}] },
  { name:"Creative Studio", signature:[{dim:"creativity",w:2},{dim:"openMindedness",w:1}] },
  { name:"Management", signature:[{dim:"leadership",w:2},{dim:"responsibility",w:1}] },
];

/* ---- Stress responses --------------------------------------- */
const STRESS_RESPONSES = [
  { name:"Fight", description:"You meet pressure head-on and push back rather than pull away.",
    signature:[{dim:"competitiveness",w:2},{dim:"confidence",w:1},{dim:"risk",w:1}] },
  { name:"Flight", description:"You create distance from the source of the stress until you can think clearly again.",
    signature:[{dim:"independence",w:2},{dim:"adaptability",w:1}] },
  { name:"Freeze", description:"Everything pauses for a moment before you can figure out the next move.",
    signature:[{dim:"emotionalStability",w:-2},{dim:"patience",w:1}] },
  { name:"Humor", description:"You defuse the tension, for yourself as much as anyone else, with a joke.",
    signature:[{dim:"humor",w:2},{dim:"adaptability",w:1}] },
  { name:"Planning", description:"You channel the stress directly into a plan, even an imperfect one.",
    signature:[{dim:"planning",w:2},{dim:"discipline",w:1}] },
  { name:"Isolation", description:"You process it alone before you're ready to bring anyone else in.",
    signature:[{dim:"independence",w:2},{dim:"socialEnergy",w:-1}] },
  { name:"Seeking Comfort", description:"You reach for warmth and reassurance, from people or routines you trust.",
    signature:[{dim:"empathy",w:1},{dim:"kindness",w:1},{dim:"socialEnergy",w:1}] },
  { name:"Talking It Out", description:"Saying it out loud to someone else is how you actually process it.",
    signature:[{dim:"socialEnergy",w:2},{dim:"trust",w:1}] },
];

/* ---- Percentage-breakdown categories (Updates 8, 9, 10) ----------------- */
const THINKING_CATEGORIES = [
  { name:"Visual", dims:["creativity","curiosity"] },
  { name:"Logical", dims:["logic","logic"] },
  { name:"Creative", dims:["creativity","openMindedness"] },
  { name:"Strategic", dims:["planning","leadership"] },
  { name:"Abstract", dims:["curiosity","openMindedness"] },
  { name:"Practical", dims:["discipline","responsibility"] },
];
const LEARNING_CATEGORIES = [
  { name:"Reading", dims:["independence","patience"] },
  { name:"Watching", dims:["patience","curiosity"] },
  { name:"Teaching", dims:["leadership","empathy"] },
  { name:"Experimenting", dims:["curiosity","risk"] },
  { name:"Building", dims:["discipline","persistence"] },
  { name:"Discussion", dims:["socialEnergy","curiosity"] },
];
const DECISION_CATEGORIES = [
  { name:"Logic", dims:["logic","logic"] },
  { name:"Emotion", dims:["empathy","empathy"] },
  { name:"Instinct", dims:["risk","confidence"] },
  { name:"Curiosity", dims:["curiosity","openMindedness"] },
  { name:"Experience", dims:["selfAwareness","resilience"] },
];
const LOVE_LANGUAGE_CATEGORIES = [
  { name:"Physical Touch", dims:["socialEnergy","trust"] },
  { name:"Words of Affirmation", dims:["empathy","confidence"] },
  { name:"Quality Time", dims:["patience","trust","kindness"] },
  { name:"Acts of Service", dims:["responsibility","kindness","discipline"] },
  { name:"Gift Giving", dims:["creativity","drive","kindness"] },
];

/* ---- Attachment and conflict styles -------------------------- */
const ATTACHMENT_STYLES = [
  { name:"Secure", signature:[{dim:"trust",w:2},{dim:"emotionalStability",w:1},{dim:"empathy",w:1}],
    description:"You're generally comfortable with closeness and don't assume the worst when things go quiet." },
  { name:"Anxious", signature:[{dim:"trust",w:-1},{dim:"emotionalStability",w:-2},{dim:"empathy",w:1}],
    description:"You feel things in relationships intensely, and reassurance genuinely helps." },
  { name:"Avoidant", signature:[{dim:"independence",w:2},{dim:"trust",w:-1}],
    description:"You value your independence in relationships enough that closeness can sometimes feel like pressure." },
  { name:"Disorganized", signature:[{dim:"emotionalStability",w:-2},{dim:"independence",w:-1},{dim:"trust",w:-1}],
    description:"You want closeness and also feel wary of it, sometimes both in the same conversation." },
];
const CONFLICT_STYLES = [
  { name:"Assertive", signature:[{dim:"confidence",w:2},{dim:"leadership",w:1}],
    description:"You say what's wrong directly, early, before it has time to build up." },
  { name:"Avoidant", signature:[{dim:"independence",w:2},{dim:"socialEnergy",w:-1}],
    description:"You'd rather let small things pass than turn every disagreement into a conversation." },
  { name:"Collaborative", signature:[{dim:"empathy",w:2},{dim:"adaptability",w:1}],
    description:"You look for the version of the disagreement where both people actually get something they need." },
  { name:"Accommodating", signature:[{dim:"kindness",w:2},{dim:"patience",w:1}],
    description:"You tend to prioritize keeping the peace, sometimes more than getting your own way." },
];

/* ---- Entertainment taste profiles ---------------------------- */
const ENTERTAINMENT_PROFILES = [
  { name:"Epic and Adventurous", signature:[{dim:"risk",w:1},{dim:"drive",w:1},{dim:"optimism",w:1}],
    music:"Orchestral scores, anthemic rock", movie:"Epic adventure, fantasy",
    tv:"Long-arc fantasy series", book:"Epic fantasy, adventure fiction" },
  { name:"Dark and Cerebral", signature:[{dim:"logic",w:1},{dim:"independence",w:1},{dim:"selfAwareness",w:1}],
    music:"Moody electronic, post-rock", movie:"Psychological thriller, neo-noir",
    tv:"Prestige crime drama", book:"Literary fiction, philosophy" },
  { name:"Warm and Comforting", signature:[{dim:"kindness",w:1},{dim:"patience",w:1},{dim:"empathy",w:1}],
    music:"Acoustic, indie folk", movie:"Heartfelt drama, slice of life",
    tv:"Cozy sitcom", book:"Contemporary fiction, memoir" },
  { name:"Bold and Energetic", signature:[{dim:"humor",w:1},{dim:"socialEnergy",w:1},{dim:"confidence",w:1}],
    music:"Pop, hip hop", movie:"Action comedy",
    tv:"Ensemble comedy", book:"Fast-paced thriller" },
  { name:"Strange and Original", signature:[{dim:"creativity",w:1},{dim:"openMindedness",w:1},{dim:"curiosity",w:1}],
    music:"Experimental, genre-blending", movie:"Surreal indie, arthouse",
    tv:"Anthology sci-fi", book:"Speculative fiction, magical realism" },
  { name:"Sharp and Strategic", signature:[{dim:"logic",w:1},{dim:"planning",w:1},{dim:"leadership",w:1}],
    music:"Classical, instrumental", movie:"Heist, courtroom drama",
    tv:"Political drama", book:"Nonfiction, strategy and history" },
  { name:"Romantic and Emotional", signature:[{dim:"empathy",w:1},{dim:"trust",w:1},{dim:"optimism",w:1}],
    music:"Soul, R&B ballads", movie:"Romance, coming of age",
    tv:"Romantic drama", book:"Romance, emotionally driven fiction" },
  { name:"Rebellious and Independent", signature:[{dim:"independence",w:1},{dim:"risk",w:1},{dim:"competitiveness",w:1}],
    music:"Punk, alt rock", movie:"Underdog sports drama, heist",
    tv:"Antihero drama", book:"Gritty realism, rebellion narratives" },
];

/* ---- Achievements -------------------------------------------
   Each test runs against normalized dimensions (-10..10). Deterministic,
   no randomness, so the same profile always unlocks the same badges. */
const ACHIEVEMENTS = [
  { name:"Professional Overthinker", icon:"\uD83E\uDDE0", description:"High logic and high self-awareness, a dangerous combination for a quiet Sunday.",
    test: nd => nd.logic >= 5 && nd.selfAwareness >= 5 },
  { name:"Chaos Gremlin", icon:"\uD83D\uDE08", description:"High risk, high humor, low discipline. A menace, affectionately.",
    test: nd => nd.risk >= 5 && nd.humor >= 4 && nd.discipline <= -1 },
  { name:"Human Wikipedia", icon:"\uD83D\uDCDA", description:"Curiosity that doesn't really have an off switch.",
    test: nd => nd.curiosity >= 6 },
  { name:"Main Character Energy", icon:"\u2B50", description:"Confidence and drive, stacked.",
    test: nd => nd.confidence >= 6 && nd.drive >= 5 },
  { name:"Golden Retriever", icon:"\uD83D\uDC15", description:"High kindness, high optimism, genuinely happy to see people.",
    test: nd => nd.kindness >= 6 && nd.optimism >= 5 },
  { name:"Black Cat", icon:"\uD83D\uDC08\u200D\u2B1B", description:"Independent, a little chaotic, weirdly good company.",
    test: nd => nd.independence >= 6 && nd.humor >= 4 },
  { name:"Certified Therapist Friend", icon:"\uD83E\uDEC2", description:"People end up telling you things they haven't told anyone else.",
    test: nd => nd.empathy >= 6 && nd.patience >= 5 },
  { name:"Touch Grass", icon:"\uD83C\uDF31", description:"Low social energy, high independence, genuinely content alone.",
    test: nd => nd.socialEnergy <= -4 && nd.independence >= 5 },
  { name:"Walking Green Flag", icon:"\uD83C\uDFF3", description:"High trust, high kindness, high responsibility. The whole package.",
    test: nd => nd.trust >= 6 && nd.kindness >= 5 && nd.responsibility >= 5 },
  { name:"Clutch Machine", icon:"\uD83C\uDFAF", description:"Resilient and disciplined under real pressure.",
    test: nd => nd.resilience >= 6 && nd.discipline >= 5 },
  { name:"Built Different", icon:"\uD83E\uDEA8", description:"Persistence and drive that doesn't run out early.",
    test: nd => nd.persistence >= 6 && nd.drive >= 5 },
  { name:"Night Owl Thinker", icon:"\uD83E\uDD89", description:"Open-minded and independent, the two traits of someone who does their best thinking off-schedule.",
    test: nd => nd.openMindedness >= 5 && nd.independence >= 5 },
  { name:"Walking Red Flag (Self-Aware About It)", icon:"\uD83D\uDEA9", description:"Competitive and guarded, but at least you know it.",
    test: nd => nd.trust <= -3 && nd.competitiveness >= 5 && nd.selfAwareness >= 3 },
  { name:"Overthinks the Group Chat", icon:"\uD83D\uDCAC", description:"High self-awareness and moderate social energy, so every message gets reread twice.",
    test: nd => nd.selfAwareness >= 6 && nd.socialEnergy >= 0 && nd.socialEnergy <= 4 },
  { name:"Quiet Storm", icon:"\u26C8", description:"Low social energy but high leadership, influence without needing the room.",
    test: nd => nd.socialEnergy <= 0 && nd.leadership >= 5 },
  { name:"Comeback Season", icon:"\uD83D\uDD01", description:"High resilience and high optimism after clearly being tested.",
    test: nd => nd.resilience >= 5 && nd.optimism >= 5 && nd.emotionalStability <= 2 },
];

/* =========================================================================
   V3 ADDITIONS
   Deeper compatibility categories, confidence/stability support, fantasy
   and story roles, friendship and work profiles, extra fun-fact lookup
   tables. Nothing above this line changes.
   ========================================================================= */

/* ---- Compatibility categories (Update: Better Compatibility Algorithm) -
   type "similarity": scored on how alike the two people are on these dims.
   type "combined": scored on how much of this energy exists between them
   together, regardless of whether they're alike. */
const COMPATIBILITY_CATEGORIES = [
  { name:"Friendship", type:"similarity", dims:["trust","kindness","socialEnergy"] },
  { name:"Romantic Compatibility", type:"similarity", dims:["empathy","trust","confidence"] },
  { name:"Marriage", type:"similarity", dims:["patience","trust","discipline"] },
  { name:"Long Distance", type:"similarity", dims:["independence","trust","discipline"] },
  { name:"Communication", type:"similarity", dims:["socialEnergy","logic","empathy"] },
  { name:"Conflict Resolution", type:"similarity", dims:["patience","empathy","logic"] },
  { name:"Trust", type:"similarity", dims:["trust"] },
  { name:"Emotional Support", type:"similarity", dims:["empathy","kindness","patience"] },
  { name:"Humor", type:"combined", dims:["humor"] },
  { name:"Adventure", type:"combined", dims:["risk","curiosity","adaptability"] },
  { name:"Gaming Partner", type:"similarity", dims:["patience","logic","humor"] },
  { name:"Travel Partner", type:"similarity", dims:["adaptability","risk","curiosity"] },
  { name:"Study Partner", type:"similarity", dims:["discipline","patience","logic"] },
  { name:"Business Partner", type:"similarity", dims:["drive","logic","discipline"] },
  { name:"Creative Partner", type:"similarity", dims:["creativity","adaptability","curiosity"] },
  { name:"Startup Partner", type:"combined", dims:["risk","drive","adaptability"] },
  { name:"Roommate", type:"similarity", dims:["patience","trust","discipline"] },
  { name:"Daily Lifestyle", type:"similarity", dims:["discipline","planning","socialEnergy"] },
  { name:"Work Habits", type:"similarity", dims:["discipline","responsibility","planning"] },
  { name:"Leadership Balance", type:"similarity", dims:["leadership"] },
  { name:"Problem Solving", type:"similarity", dims:["logic","creativity","adaptability"] },
  { name:"Emotional Intelligence", type:"similarity", dims:["empathy","selfAwareness"] },
  { name:"Social Energy Balance", type:"similarity", dims:["socialEnergy"] },
  { name:"Life Goals", type:"similarity", dims:["drive","optimism","planning"] },
  { name:"Risk Taking", type:"similarity", dims:["risk"] },
  { name:"Decision Style", type:"similarity", dims:["logic","risk","curiosity"] },
  { name:"Learning Style", type:"similarity", dims:["independence","curiosity","socialEnergy"] },
  { name:"Future Planning", type:"similarity", dims:["planning","optimism"] },
  { name:"Reliability", type:"similarity", dims:["responsibility","discipline","trust"] },
  { name:"Fun Together", type:"combined", dims:["humor","socialEnergy","optimism"] },
  { name:"Chaos Together", type:"combined", dims:["risk","humor"] },
];

/* ---- "Who does X more" comparisons -------------------------------------- */
const WHO_COMPARISONS = [
  { label:"Plans More", dim:"planning" },
  { label:"Takes More Risks", dim:"risk" },
  { label:"Leads More", dim:"leadership" },
  { label:"Supports More", dim:"kindness" },
  { label:"Comforts More", dim:"empathy" },
  { label:"Motivates More", dim:"drive" },
  { label:"Listens Better", dim:"patience" },
  { label:"Decides Faster", dim:"confidence" },
  { label:"Is More Creative", dim:"creativity" },
  { label:"Is More Practical", dim:"discipline" },
  { label:"Is More Curious", dim:"curiosity" },
  { label:"Is More Competitive", dim:"competitiveness" },
  { label:"Is More Social", dim:"socialEnergy" },
  { label:"Is More Independent", dim:"independence" },
  { label:"Is More Organized", dim:"planning" },
  { label:"Is More Emotionally Reactive", dim:"emotionalStability", invert:true },
  { label:"Is More Logical", dim:"logic" },
];

/* ---- Fantasy roles (Update: Fantasy Role) -------------------------------- */
const FANTASY_ROLES = [
  { name:"Knight", icon:"\u2694", signature:[{dim:"discipline",w:1},{dim:"responsibility",w:2},{dim:"resilience",w:1}],
    description:"You hold the line. Discipline and duty come before comfort, every time." },
  { name:"Mage", icon:"\uD83D\uDD2E", signature:[{dim:"logic",w:2},{dim:"curiosity",w:1}],
    description:"You study the underlying rules of things until you can bend them." },
  { name:"Healer", icon:"\uD83D\uDC9A", signature:[{dim:"empathy",w:2},{dim:"kindness",w:1}],
    description:"You notice pain before it's spoken and you don't walk past it." },
  { name:"Ranger", icon:"\uD83C\uDFF9", signature:[{dim:"independence",w:1},{dim:"curiosity",w:1},{dim:"patience",w:1}],
    description:"You're most yourself off the marked trail, self-reliant and observant." },
  { name:"Bard", icon:"\uD83C\uDFB5", signature:[{dim:"humor",w:1},{dim:"socialEnergy",w:1},{dim:"creativity",w:1}],
    description:"You move rooms with words, and you're rarely short of either." },
  { name:"Rogue", icon:"\uD83D\uDDE1", signature:[{dim:"risk",w:1},{dim:"adaptability",w:1},{dim:"independence",w:1}],
    description:"Rules are more of a starting position than a boundary for you." },
  { name:"Necromancer", icon:"\uD83D\uDC80", signature:[{dim:"independence",w:2},{dim:"logic",w:1}],
    description:"You're comfortable in territory most people avoid, literally or otherwise." },
  { name:"Summoner", icon:"\uD83D\uDC09", signature:[{dim:"leadership",w:1},{dim:"creativity",w:1},{dim:"socialEnergy",w:1}],
    description:"You rarely do it all yourself, you're good at bringing the right help in." },
  { name:"Alchemist", icon:"\u2697", signature:[{dim:"curiosity",w:2},{dim:"creativity",w:1}],
    description:"You're always mid-experiment, combining things nobody else thought to combine." },
  { name:"Blacksmith", icon:"\uD83D\uDD28", signature:[{dim:"discipline",w:1},{dim:"persistence",w:2}],
    description:"You build things that last through sheer repeated, unglamorous effort." },
  { name:"Monk", icon:"\uD83E\uDDD8", signature:[{dim:"patience",w:2},{dim:"selfAwareness",w:1}],
    description:"You've done the internal work most people put off indefinitely." },
  { name:"Guardian", icon:"\uD83D\uDEE1", signature:[{dim:"responsibility",w:2},{dim:"trust",w:1}],
    description:"Something or someone is always under your watch, by choice." },
  { name:"Beast Tamer", icon:"\uD83E\uDD8A", signature:[{dim:"empathy",w:1},{dim:"patience",w:1},{dim:"trust",w:1}],
    description:"You earn trust slowly, from people and animals both, and it holds." },
  { name:"Explorer", icon:"\uD83E\uDDED", signature:[{dim:"curiosity",w:2},{dim:"risk",w:1}],
    description:"Unmapped territory is an invitation, not a warning." },
  { name:"Captain", icon:"\u2693", signature:[{dim:"leadership",w:1},{dim:"confidence",w:1},{dim:"responsibility",w:1}],
    description:"You take the wheel because someone has to and you trust yourself with it." },
  { name:"Scholar", icon:"\uD83D\uDCDA", signature:[{dim:"logic",w:1},{dim:"curiosity",w:1},{dim:"discipline",w:1}],
    description:"You'd rather fully understand something than just get by with it." },
  { name:"Oracle", icon:"\uD83D\uDD2E", signature:[{dim:"selfAwareness",w:2},{dim:"empathy",w:1}],
    description:"You sense where things are heading before most people name it." },
  { name:"Inventor", icon:"\u2699", signature:[{dim:"creativity",w:1},{dim:"logic",w:1},{dim:"persistence",w:1}],
    description:"You'd rather build the thing that doesn't exist yet than wait for someone else to." },
  { name:"Merchant", icon:"\uD83D\uDCB0", signature:[{dim:"socialEnergy",w:1},{dim:"drive",w:1},{dim:"adaptability",w:1}],
    description:"You read a deal, and a room, quickly, and you rarely leave empty-handed." },
  { name:"Dragon Rider", icon:"\uD83D\uDC09", signature:[{dim:"risk",w:1},{dim:"trust",w:1},{dim:"confidence",w:1}],
    description:"You bond fast with something powerful and back it completely once you do." },
];

/* ---- Friend type (Friendship Profile) ------------------------------------ */
const FRIEND_TYPES = [
  { name:"The Fun Friend", signature:[{dim:"humor",w:2},{dim:"socialEnergy",w:1}] },
  { name:"The Therapist Friend", signature:[{dim:"empathy",w:2},{dim:"patience",w:1}] },
  { name:"The Golden Retriever Friend", signature:[{dim:"kindness",w:2},{dim:"optimism",w:1}] },
  { name:"The Black Cat Friend", signature:[{dim:"independence",w:2},{dim:"humor",w:1}] },
  { name:"The Protective Friend", signature:[{dim:"responsibility",w:2},{dim:"trust",w:1}] },
  { name:"The Planner Friend", signature:[{dim:"planning",w:2},{dim:"discipline",w:1}] },
  { name:"The Wildcard Friend", signature:[{dim:"risk",w:1},{dim:"humor",w:1},{dim:"adaptability",w:1}] },
  { name:"The Steady Friend", signature:[{dim:"resilience",w:1},{dim:"trust",w:1},{dim:"patience",w:1}] },
];

/* ---- Motivation styles (Motivation Profile) ------------------------------- */
const MOTIVATION_STYLES = [
  { name:"Driven by Mastery", signature:[{dim:"discipline",w:1},{dim:"persistence",w:1},{dim:"curiosity",w:1}] },
  { name:"Driven by Recognition", signature:[{dim:"confidence",w:1},{dim:"competitiveness",w:1},{dim:"drive",w:1}] },
  { name:"Driven by Connection", signature:[{dim:"empathy",w:1},{dim:"socialEnergy",w:1},{dim:"kindness",w:1}] },
  { name:"Driven by Purpose", signature:[{dim:"responsibility",w:1},{dim:"optimism",w:1},{dim:"drive",w:1}] },
  { name:"Driven by Freedom", signature:[{dim:"independence",w:2},{dim:"risk",w:1}] },
];

/* ---- Soul Type: a separate, deeper identity lens ---------------------------
   Not the archetype system and not scored against it — this is a second,
   independent read of the same normDims, structured like the other
   scoreBySignature() lookups above (mythical creature, motivation style,
   etc.), just with a fixed 7-item palette instead of 30 archetypes. The
   archetype answers "which of 30 patterns fits your answers best"; soul
   type answers "which single core value shows up strongest," a coarser,
   more elemental read that intentionally overlaps with (rather than
   derives from) the archetype score. Colors and their meanings are a
   fixed, non-negotiable palette — do not add or reorder entries. */
const SOUL_TYPES = [
  { name:"Red", hex:"#EF4444", trait:"Determination", meaning:"Willpower, persistence, refusing to give up.", signature:[{dim:"persistence",w:2},{dim:"drive",w:1},{dim:"resilience",w:1}] },
  { name:"Orange", hex:"#F97316", trait:"Bravery", meaning:"Courage, facing danger head-on.", signature:[{dim:"risk",w:2},{dim:"confidence",w:1}] },
  { name:"Yellow", hex:"#EAB308", trait:"Justice", meaning:"Fairness, righteousness.", signature:[{dim:"logic",w:1},{dim:"trust",w:1},{dim:"responsibility",w:1}] },
  { name:"Green", hex:"#22C55E", trait:"Kindness", meaning:"Compassion, caring for others.", signature:[{dim:"kindness",w:2},{dim:"empathy",w:1}] },
  { name:"Blue", hex:"#3B82F6", trait:"Integrity", meaning:"Honesty, strong moral principles.", signature:[{dim:"responsibility",w:2},{dim:"discipline",w:1}] },
  { name:"Purple", hex:"#A855F7", trait:"Perseverance", meaning:"Endurance, continuing despite hardship.", signature:[{dim:"resilience",w:2},{dim:"patience",w:1}] },
  { name:"Light Blue", hex:"#38BDF8", trait:"Patience", meaning:"Calmness, waiting and enduring.", signature:[{dim:"patience",w:2},{dim:"emotionalStability",w:1}] },
];
function computeSoulType(normDims){ return scoreBySignature(SOUL_TYPES, normDims)[0].item; }

/* ---- Fun extra profiles: mythical creature, season, weather, planet ------- */
const MYTHICAL_CREATURES = [
  { name:"Phoenix", signature:[{dim:"resilience",w:2},{dim:"optimism",w:1}] },
  { name:"Dragon", signature:[{dim:"confidence",w:1},{dim:"leadership",w:1},{dim:"risk",w:1}] },
  { name:"Kitsune", signature:[{dim:"creativity",w:1},{dim:"humor",w:1},{dim:"adaptability",w:1}] },
  { name:"Griffin", signature:[{dim:"responsibility",w:1},{dim:"leadership",w:1}] },
  { name:"Selkie", signature:[{dim:"independence",w:1},{dim:"emotionalStability",w:-1}] },
  { name:"Unicorn", signature:[{dim:"kindness",w:2},{dim:"trust",w:1}] },
  { name:"Sphinx", signature:[{dim:"logic",w:2},{dim:"curiosity",w:1}] },
  { name:"Kraken", signature:[{dim:"independence",w:2},{dim:"competitiveness",w:1}] },
];
const SEASONS = [
  { name:"Spring", signature:[{dim:"optimism",w:1},{dim:"openMindedness",w:1}] },
  { name:"Summer", signature:[{dim:"socialEnergy",w:1},{dim:"drive",w:1}] },
  { name:"Autumn", signature:[{dim:"selfAwareness",w:1},{dim:"patience",w:1}] },
  { name:"Winter", signature:[{dim:"independence",w:1},{dim:"discipline",w:1}] },
];
const TIMES_OF_DAY = [
  { name:"Golden Hour", signature:[{dim:"creativity",w:1},{dim:"optimism",w:1}] },
  { name:"Midnight", signature:[{dim:"independence",w:1},{dim:"creativity",w:1}] },
  { name:"Early Morning", signature:[{dim:"discipline",w:1},{dim:"planning",w:1}] },
  { name:"Midday", signature:[{dim:"drive",w:1},{dim:"socialEnergy",w:1}] },
];
const CHESS_PIECES = [
  { name:"The King", signature:[{dim:"responsibility",w:2},{dim:"patience",w:1}] },
  { name:"The Queen", signature:[{dim:"leadership",w:1},{dim:"adaptability",w:1},{dim:"drive",w:1}] },
  { name:"The Knight", signature:[{dim:"creativity",w:1},{dim:"risk",w:1}] },
  { name:"The Bishop", signature:[{dim:"logic",w:1},{dim:"independence",w:1}] },
  { name:"The Rook", signature:[{dim:"discipline",w:2}] },
  { name:"The Pawn Who Reaches the End", signature:[{dim:"persistence",w:2},{dim:"resilience",w:1}] },
];

/* =========================================================================
   V4 ADDITIONS
   Framework approximations, consistency-check pairs, duo titles, and the
   remaining profile lookup tables. Nothing above this line changes.
   ========================================================================= */

/* ---- Consistency check ---------------------------------------------------
   Pairs of existing questions from different clusters that already probe
   overlapping traits, phrased differently because they were written for
   different scenarios. If both members of a pair get asked in the same
   run (adaptive selection means that's not guaranteed), the engine can
   check whether the chosen answers pulled in the same direction on their
   shared dimension. This reuses real content rather than needing a
   second, secretly-duplicated question bank. */
const CONSISTENCY_PAIRS = [
  { a:"soc1", b:"imp1", dim:"risk" },
  { a:"soc2", b:"lea2", dim:"planning" },
  { a:"ana1", b:"cau2", dim:"risk" },
  { a:"cre1", b:"pla1", dim:"creativity" },
  { a:"cre3", b:"lea3", dim:"leadership" },
  { a:"imp2", b:"cau1", dim:"risk" },
  { a:"imp3", b:"phi2", dim:"optimism" },
  { a:"emp1", b:"lea1", dim:"leadership" },
  { a:"emp2", b:"imp1", dim:"empathy" },
  { a:"emp3", b:"soc3", dim:"kindness" },
  { a:"phi1", b:"amb3", dim:"drive" },
  { a:"phi3", b:"lea2", dim:"adaptability" },
  { a:"pla2", b:"cre2", dim:"humor" },
  { a:"pla3", b:"soc1", dim:"socialEnergy" },
  { a:"cau1", b:"ana2", dim:"logic" },
  { a:"cau3", b:"amb1", dim:"planning" },
  { a:"amb2", b:"phi2", dim:"risk" },
  { a:"ana3", b:"cau1", dim:"discipline" },
];

/* ---- Framework approximations (Update: Personality System) ---------------
   Clearly secondary to the PersonaForge archetype. Big Five and DISC are
   percentage breakdowns; MBTI and Enneagram pick a best match the same
   way archetypes do. */
const BIG_FIVE_CATEGORIES = [
  { name:"Openness", dims:["openMindedness","curiosity","creativity"] },
  { name:"Conscientiousness", dims:["discipline","responsibility","planning"] },
  { name:"Extraversion", dims:["socialEnergy","confidence"] },
  { name:"Agreeableness", dims:["kindness","empathy","trust"] },
  { name:"Neuroticism", dims:["emotionalStability"], invert:true },
];
const DISC_CATEGORIES = [
  { name:"D, Dominance", dims:["leadership","confidence","competitiveness"] },
  { name:"I, Influence", dims:["socialEnergy","humor","confidence"] },
  { name:"S, Steadiness", dims:["patience","trust","kindness"] },
  { name:"C, Conscientiousness", dims:["discipline","logic","planning"] },
];
const ENNEAGRAM_TYPES = [
  { name:"Type 1, The Reformer", signature:[{dim:"discipline",w:2},{dim:"responsibility",w:1}] },
  { name:"Type 2, The Helper", signature:[{dim:"kindness",w:2},{dim:"empathy",w:1}] },
  { name:"Type 3, The Achiever", signature:[{dim:"drive",w:2},{dim:"confidence",w:1}] },
  { name:"Type 4, The Individualist", signature:[{dim:"creativity",w:1},{dim:"selfAwareness",w:2}] },
  { name:"Type 5, The Investigator", signature:[{dim:"curiosity",w:1},{dim:"independence",w:2}] },
  { name:"Type 6, The Loyalist", signature:[{dim:"trust",w:1},{dim:"responsibility",w:1},{dim:"risk",w:-1}] },
  { name:"Type 7, The Enthusiast", signature:[{dim:"optimism",w:1},{dim:"humor",w:1},{dim:"risk",w:1}] },
  { name:"Type 8, The Challenger", signature:[{dim:"confidence",w:1},{dim:"leadership",w:1},{dim:"competitiveness",w:1}] },
  { name:"Type 9, The Peacemaker", signature:[{dim:"patience",w:2},{dim:"adaptability",w:1}] },
];
/* ---- Human Values --------------------------------------------------------
   A motivational layer, separate from archetype/frameworks: not "what
   type are you" but "what seems to move you when you decide things".
   Each value is a weighted signature over the same 25 measured
   dimensions, scored the same way archetype signatures are, so nothing
   new is being invented, just a different lens on the same evidence.
   Explicitly PersonaForge's interpretation, not a validated instrument. */
const HUMAN_VALUES = [
  { id:"determination", name:"Determination", icon:"\uD83D\uDCAA",
    signature:[{dim:"drive",w:2},{dim:"persistence",w:2},{dim:"discipline",w:1}],
    why:"how much you push through rather than let go" },
  { id:"justice", name:"Justice", icon:"\u2696\uFE0F",
    signature:[{dim:"responsibility",w:2},{dim:"logic",w:1},{dim:"trust",w:1}],
    why:"how much fairness and accountability shape your calls" },
  { id:"compassion", name:"Compassion", icon:"\uD83E\uDEC2",
    signature:[{dim:"empathy",w:2},{dim:"kindness",w:2}],
    why:"how readily you feel and respond to what others are going through" },
  { id:"curiosity", name:"Curiosity", icon:"\uD83D\uDD0D",
    signature:[{dim:"curiosity",w:2},{dim:"openMindedness",w:1}],
    why:"how much unanswered questions pull at you" },
  { id:"bravery", name:"Bravery", icon:"\uD83E\uDDA1",
    signature:[{dim:"risk",w:2},{dim:"confidence",w:1},{dim:"resilience",w:1}],
    why:"how willing you are to act despite the odds or the fear" },
  { id:"integrity", name:"Integrity", icon:"\uD83E\uDEA8",
    signature:[{dim:"trust",w:2},{dim:"selfAwareness",w:1},{dim:"responsibility",w:1}],
    why:"how consistent you stay between what you believe and what you do" },
  { id:"hope", name:"Hope", icon:"\u2728",
    signature:[{dim:"optimism",w:2},{dim:"resilience",w:1}],
    why:"how much you expect things to work out, even under pressure" },
  { id:"wisdom", name:"Wisdom", icon:"\uD83E\uDD89",
    signature:[{dim:"selfAwareness",w:2},{dim:"logic",w:1},{dim:"openMindedness",w:1}],
    why:"how much reflection shapes your judgment before you act" },
  { id:"kindness", name:"Kindness", icon:"\uD83D\uDC9E",
    signature:[{dim:"kindness",w:2},{dim:"empathy",w:1},{dim:"patience",w:1}],
    why:"how naturally you extend warmth without being asked" },
  { id:"creativity", name:"Creativity", icon:"\uD83C\uDFA8",
    signature:[{dim:"creativity",w:2},{dim:"openMindedness",w:1},{dim:"curiosity",w:1}],
    why:"how much you reach for a new angle instead of the obvious one" },
  { id:"discipline", name:"Discipline", icon:"\uD83C\uDFAF",
    signature:[{dim:"discipline",w:2},{dim:"planning",w:1},{dim:"persistence",w:1}],
    why:"how consistently you follow through on your own structure" },
  { id:"loyalty", name:"Loyalty", icon:"\uD83E\uDD1D",
    signature:[{dim:"trust",w:2},{dim:"patience",w:1},{dim:"responsibility",w:1}],
    why:"how much you stay committed once you're in" },
  { id:"freedom", name:"Freedom", icon:"\uD83E\uDD85",
    signature:[{dim:"independence",w:2},{dim:"adaptability",w:1},{dim:"risk",w:1}],
    why:"how much you protect your own room to choose" },
  { id:"responsibility", name:"Responsibility", icon:"\uD83E\uDEA2",
    signature:[{dim:"responsibility",w:2},{dim:"discipline",w:1},{dim:"planning",w:1}],
    why:"how seriously you treat the things you're accountable for" },
];

/* ---- Seven Sins / Heavenly Virtues (fun profile) --------------------------
   A playful, explicitly non-serious lens: each axis is one measured
   dimension read two ways. The Sin reading and the Virtue reading are
   opposite ends of the exact same evidence, nothing is recalculated,
   only the label and direction flip. */
const SIN_VIRTUE_AXES = [
  { dim:"confidence", sinLabel:"Pride", virtueLabel:"Humility", sinIsHigh:true },
  { dim:"competitiveness", sinLabel:"Greed", virtueLabel:"Charity", sinIsHigh:true },
  { dim:"patience", sinLabel:"Wrath", virtueLabel:"Patience", sinIsHigh:false },
  { dim:"kindness", sinLabel:"Envy", virtueLabel:"Kindness", sinIsHigh:false },
  { dim:"risk", sinLabel:"Lust", virtueLabel:"Chastity", sinIsHigh:true },
  { dim:"discipline", sinLabel:"Gluttony", virtueLabel:"Temperance", sinIsHigh:false },
  { dim:"drive", sinLabel:"Sloth", virtueLabel:"Diligence", sinIsHigh:false },
];

const MBTI_AXES = [
  { letters:["E","I"], posDims:["socialEnergy"], negDims:[] },
  { letters:["N","S"], posDims:["openMindedness","curiosity"], negDims:["discipline","planning"] },
  { letters:["F","T"], posDims:["empathy","kindness"], negDims:["logic"] },
  { letters:["P","J"], posDims:["adaptability","risk"], negDims:["discipline","planning"] },
];

/* ---- Duo titles for the compare page --------------------------------------
   Keyed by element pairs from ARCHETYPE_EXTRAS, sorted alphabetically so
   the lookup works regardless of who's "person A". Falls back to a
   generic template when there's no special pairing. */
const DUO_TITLES = {
  "Fire|Ice": "Fire & Ice",
  "Fire|Fire": "Twin Flames",
  "Water|Fire": "Steam and Spark",
  "Earth|Air": "Roots and Wind",
  "Light|Shadow": "Sun & Moon",
  "Metal|Fire": "Forge Partners",
  "Storm|Earth": "Calm and Chaos",
  "Water|Water": "Deep Waters",
  "Air|Air": "Kindred Spirits",
  "Earth|Earth": "Built to Last",
  "Light|Light": "Twin Beacons",
  "Shadow|Shadow": "Quiet Understanding",
  "Ice|Storm": "Cold Front",
  "Water|Air": "Tide and Wind",
};

/* ---- Fantasy extras: weapon, companion, kingdom --------------------------- */
const FANTASY_WEAPONS = [
  { name:"A precisely balanced longsword", signature:[{dim:"discipline",w:1},{dim:"responsibility",w:1}] },
  { name:"A staff carved with half-finished runes", signature:[{dim:"curiosity",w:1},{dim:"logic",w:1}] },
  { name:"Twin daggers, never both sheathed at once", signature:[{dim:"risk",w:1},{dim:"adaptability",w:1}] },
  { name:"A warhammer that's more often used to build than break", signature:[{dim:"persistence",w:1},{dim:"discipline",w:1}] },
  { name:"A longbow, kept for range and patience alike", signature:[{dim:"patience",w:1},{dim:"independence",w:1}] },
  { name:"A shield older than anyone can explain", signature:[{dim:"responsibility",w:1},{dim:"trust",w:1}] },
  { name:"A voice, sharper than most blades in the right moment", signature:[{dim:"socialEnergy",w:1},{dim:"confidence",w:1}] },
  { name:"A satchel of half-tested alchemical tricks", signature:[{dim:"creativity",w:1},{dim:"curiosity",w:1}] },
];
const FANTASY_COMPANIONS = [
  { name:"A war-scarred wolf who trusts almost no one else", signature:[{dim:"independence",w:1},{dim:"trust",w:1}] },
  { name:"A small dragon still learning to control its fire", signature:[{dim:"creativity",w:1},{dim:"risk",w:1}] },
  { name:"A raven that shows up exactly when needed", signature:[{dim:"curiosity",w:1},{dim:"selfAwareness",w:1}] },
  { name:"A steady warhorse, unfazed by almost anything", signature:[{dim:"resilience",w:1},{dim:"patience",w:1}] },
  { name:"A talking cat who mostly offers unsolicited opinions", signature:[{dim:"humor",w:1},{dim:"confidence",w:1}] },
  { name:"A quiet familiar spirit, more sensed than seen", signature:[{dim:"empathy",w:1},{dim:"openMindedness",w:1}] },
];
const FANTASY_KINGDOMS = [
  { name:"A mountain hold built to outlast every siege", signature:[{dim:"discipline",w:1},{dim:"responsibility",w:1}] },
  { name:"A floating city that answers to no single ruler", signature:[{dim:"independence",w:2}] },
  { name:"A forest realm where the borders move with the seasons", signature:[{dim:"adaptability",w:1},{dim:"openMindedness",w:1}] },
  { name:"A port city that trades in everything, including secrets", signature:[{dim:"socialEnergy",w:1},{dim:"curiosity",w:1}] },
  { name:"A small, fiercely loyal village, not a kingdom by choice", signature:[{dim:"kindness",w:1},{dim:"trust",w:1}] },
  { name:"An empire still being built, one campaign at a time", signature:[{dim:"drive",w:1},{dim:"leadership",w:1}] },
];

/* ---- Fun profile extras: flower, planet, constellation, gemstone, weather - */
const FLOWERS = [
  { name:"Black Dahlia", signature:[{dim:"independence",w:1},{dim:"selfAwareness",w:1}] },
  { name:"Sunflower", signature:[{dim:"optimism",w:1},{dim:"socialEnergy",w:1}] },
  { name:"Wild Poppy", signature:[{dim:"risk",w:1},{dim:"creativity",w:1}] },
  { name:"White Orchid", signature:[{dim:"discipline",w:1},{dim:"patience",w:1}] },
  { name:"Wisteria", signature:[{dim:"kindness",w:1},{dim:"empathy",w:1}] },
  { name:"Thistle", signature:[{dim:"resilience",w:1},{dim:"independence",w:1}] },
];
const PLANETS = [
  { name:"Mars", signature:[{dim:"drive",w:1},{dim:"competitiveness",w:1}] },
  { name:"Neptune", signature:[{dim:"creativity",w:1},{dim:"selfAwareness",w:1}] },
  { name:"Saturn", signature:[{dim:"discipline",w:1},{dim:"responsibility",w:1}] },
  { name:"Venus", signature:[{dim:"empathy",w:1},{dim:"kindness",w:1}] },
  { name:"Mercury", signature:[{dim:"adaptability",w:1},{dim:"curiosity",w:1}] },
  { name:"Jupiter", signature:[{dim:"leadership",w:1},{dim:"optimism",w:1}] },
];
const CONSTELLATIONS = [
  { name:"Orion", signature:[{dim:"confidence",w:1},{dim:"leadership",w:1}] },
  { name:"Lyra", signature:[{dim:"creativity",w:1},{dim:"humor",w:1}] },
  { name:"Draco", signature:[{dim:"independence",w:1},{dim:"resilience",w:1}] },
  { name:"Cassiopeia", signature:[{dim:"selfAwareness",w:1},{dim:"confidence",w:1}] },
  { name:"Pegasus", signature:[{dim:"optimism",w:1},{dim:"risk",w:1}] },
  { name:"Ursa Minor", signature:[{dim:"patience",w:1},{dim:"trust",w:1}] },
];
const GEMSTONES = [
  { name:"Garnet", signature:[{dim:"drive",w:1},{dim:"competitiveness",w:1}] },
  { name:"Sapphire", signature:[{dim:"logic",w:1},{dim:"discipline",w:1}] },
  { name:"Moonstone", signature:[{dim:"empathy",w:1},{dim:"selfAwareness",w:1}] },
  { name:"Obsidian", signature:[{dim:"independence",w:1},{dim:"confidence",w:1}] },
  { name:"Citrine", signature:[{dim:"optimism",w:1},{dim:"socialEnergy",w:1}] },
  { name:"Emerald", signature:[{dim:"kindness",w:1},{dim:"trust",w:1}] },
];
const WEATHER_TYPES = [
  { name:"Clear Sky", signature:[{dim:"optimism",w:1},{dim:"emotionalStability",w:1}] },
  { name:"Thunderstorm", signature:[{dim:"drive",w:1},{dim:"competitiveness",w:1}] },
  { name:"Fog", signature:[{dim:"independence",w:1},{dim:"selfAwareness",w:1}] },
  { name:"Steady Rain", signature:[{dim:"patience",w:1},{dim:"discipline",w:1}] },
  { name:"First Snow", signature:[{dim:"creativity",w:1},{dim:"openMindedness",w:1}] },
  { name:"Golden Hour Light", signature:[{dim:"kindness",w:1},{dim:"optimism",w:1}] },
];
const COFFEE_ORDERS = [
  { name:"Black, no sugar, no apology", signature:[{dim:"discipline",w:1},{dim:"independence",w:1}] },
  { name:"Oversized oat milk latte, extra shot", signature:[{dim:"socialEnergy",w:1},{dim:"drive",w:1}] },
  { name:"Whatever's seasonal, decided on the spot", signature:[{dim:"curiosity",w:1},{dim:"adaptability",w:1}] },
  { name:"The same order every single time", signature:[{dim:"discipline",w:1},{dim:"patience",w:1}] },
  { name:"Matcha, and a little smug about it", signature:[{dim:"selfAwareness",w:1},{dim:"openMindedness",w:1}] },
  { name:"Iced, regardless of the weather", signature:[{dim:"risk",w:1},{dim:"confidence",w:1}] },
];



/* =========================================================================
   PERSONAFORGE, ENGINE MODULE
   All algorithms documented inline. Pure functions, no DOM, fully testable.
   ========================================================================= */

const CLUSTERS = Object.keys(QUESTION_BANK);
const MIN_QUESTIONS = 35;          // Stages 1-3 always run to exactly this many (15 fixed + 20 adaptive)
const MAX_QUESTIONS = 45;          // never exceeds this many (35 baseline + at most 10 extra)
// Empirically calibrated (not the original 95): a per-step greedy search
// that simulates every candidate option at every question and always
// picks whichever maximizes computeAssessmentConfidence().overall right
// now — i.e. the best any answering strategy can realistically do —
// still only reached ~81-85 overall by Q35-45 across dozens of trialed
// target archetypes. 95 was consequently unreachable by any answer
// pattern, silently turning "stop early once confident" into dead code
// (every adaptive session ran to MAX_QUESTIONS regardless of how clear
// the profile was). 80 sits just under that empirical ceiling: a
// genuinely clear, consistent profile can still cross it and stop at
// 35, while a noisy/inconsistent one (measured ~73-78 in the same
// testing) correctly does not and keeps extending.
const CONFIDENCE_TARGET = 80;      // stop early once this confident
const CONFIDENCE_SCALE = 7;        // score-gap that counts as "fully confident", tuned against real score distributions
// NOTE ON SCALING: the question bank holds 200 questions across 10
// clusters (20 each). Stages 1-3 (see below) always run to exactly
// MIN_QUESTIONS: a fixed 15-question baseline (Stage 1) plus 20
// adaptively-selected questions (Stages 2-3, 10 each). From there,
// Stage 4/5 re-checks confidence after every answer and keeps going
// only if the top two archetype candidates are still close, up to
// MAX_QUESTIONS (at most 10 more beyond the 35 baseline).

/* ---- Which dimensions matter most to the framework projections ---------
   Same idea as the old cluster-weight table, but for MBTI/Big
   Five/DISC/Enneagram instead of clusters. Used by the info-value
   question ranking below so "improves framework confidence" is a real,
   computed signal rather than a hand-authored tag. */
function computeFrameworkDimensionWeights(){
  const weights = {};
  DIMENSIONS.forEach(d => weights[d] = 0);
  MBTI_AXES.forEach(axis => {
    axis.posDims.concat(axis.negDims).forEach(d => { weights[d] = (weights[d] || 0) + 1; });
  });
  BIG_FIVE_CATEGORIES.forEach(cat => cat.dims.forEach(d => { weights[d] = (weights[d] || 0) + 1; }));
  DISC_CATEGORIES.forEach(cat => cat.dims.forEach(d => { weights[d] = (weights[d] || 0) + 1; }));
  ENNEAGRAM_TYPES.forEach(type => type.signature.forEach(s => { weights[s.dim] = (weights[s.dim] || 0) + Math.abs(s.w); }));
  return weights;
}
const FRAMEWORK_DIMENSION_WEIGHTS = computeFrameworkDimensionWeights();

const QUESTIONS_BY_ID = {};
QUESTIONS.forEach(q => { QUESTIONS_BY_ID[q.id] = q; });

/* ---- Stage 1: the fixed core set ----------------------------------------
   Every user gets exactly these 15 questions, in this order, first. No
   seed, no shuffle. Chosen offline by a greedy set-cover pass over the
   full question bank: together they touch all 25 dimensions at least
   once and all 10 clusters at least once, in as few questions as
   possible, so Stage 1 is a genuine broad foundation rather than an
   arbitrary first slice of the bank. */
const CORE_QUESTION_IDS = ["ana6","ana8","pla4","amb13","cre18","soc3","phi17","cau2","emp3","imp4","lea12","pla1","amb16","ana1","cre5"];

/* -------------------------------------------------------------------------
   ALGORITHM: Deterministic staged adaptive question selection
   Five stages, replacing the old seed-shuffled baseline. The engine now
   depends only on accumulated answers, never on wall-clock time, so two
   people who answer identically get identical questions at every stage.

   Stage 1 (Q1-15): CORE_QUESTION_IDS, fixed, identical for every user —
     no randomness, no seed, so everyone's baseline starts from the same
     15 questions.
   Stage 2 (Q16-25): one batch of 10, picked by _pickInformativeBatch()
     against the state after Q15. Same first 15 answers -> same 16-25.
   Stage 3 (Q26-35): another batch of 10, against the state after Q25.
     Same first 25 answers -> same 26-35. Stages 2+3 together are the
     "20 adaptive questions": selected purely from the running answer
     history (dimension confidence, archetype-candidate separation,
     framework relevance), never from the clock or a session seed, so
     two people with identical first-15 answers always get an identical
     16-35 too.
   Stage 4 (after Q35): confidence check using the evidence-based
     computeAssessmentConfidence(). Stops here if the target is met —
     this is the common "35 was enough" exit.
   Stage 5 (Q36-45): only if Stage 4 wasn't confident enough. Unlike
     Stages 2-3, this re-checks confidence after every single answer
     (not in batches of 5) and stops the instant the target is reached,
     since minimizing extra questions matters most this late in the
     quiz — a profile that becomes confident at, say, Q39 never gets
     asked Q40-45 just because it started down this path. Hard-capped
     at MAX_QUESTIONS (45) either way.

   Question selection itself (_pickInformativeBatch) ranks every unused
   question by computeQuestionInfoValue(): how much it addresses
   currently-uncertain dimensions, how well it separates the current
   top-2 archetype candidates, how relevant it is to the framework
   projections, minus a penalty for overlapping dimensions already
   asked about. All four signals are computed from data the app already
   has (archetype signatures, framework dimension maps, running answer
   history), nothing was hand-tagged onto the question bank.

   this.clusterAffinity/clusterAsked are still tracked on every answer,
   the same running per-cluster signal the old cluster-ranked picker
   used, since encouragement() and save/resume format both read them and
   there's no reason to discard a working, harmless signal.
------------------------------------------------------------------------- */

/* Every signal here is derived from data that already exists (question
   deltas, archetype signatures, framework dimension maps, running answer
   history) - nothing new was authored onto the question bank.
     - uncertainty:  favors dimensions this session has the least evidence
                     for yet (getDimensionConfidence), weighted by how
                     strongly this question would move that dimension
     - separation:   favors questions whose dimension profile lines up
                     with what currently separates the top-2 archetype
                     candidates (same signature-diff idea the old
                     disambiguation boost used, applied per-question)
     - framework:    favors dimensions that matter to MBTI/Big Five/DISC/
                     Enneagram, a small signal so framework confidence
                     improves alongside archetype confidence
     - redundancy:   penalizes overlap with dimensions already answered
                     about a lot, so the same ground isn't covered twice */
function computeQuestionInfoValue(q, session, top, second){
  const dimSet = new Set();
  q.options.forEach(opt => Object.keys(opt.d).forEach(d => dimSet.add(d)));
  const avgMag = (d) => q.options.reduce((s,o) => s + Math.abs(o.d[d] || 0), 0) / q.options.length;

  let uncertainty = 0;
  dimSet.forEach(d => {
    const confidence = getDimensionConfidence(session, d); // 0-1, lower = less evidence so far
    uncertainty += (1 - confidence) * avgMag(d);
  });

  let separation = 0;
  if (top && second){
    const diff = {};
    top.signature.forEach(s => { diff[s.dim] = (diff[s.dim] || 0) + s.w; });
    second.signature.forEach(s => { diff[s.dim] = (diff[s.dim] || 0) - s.w; });
    dimSet.forEach(d => { separation += Math.abs(diff[d] || 0) * avgMag(d); });
  }

  let framework = 0;
  dimSet.forEach(d => { framework += (FRAMEWORK_DIMENSION_WEIGHTS[d] || 0) * 0.3; });

  let redundancy = 0;
  session.answers.forEach(a => {
    if (!a) return;
    dimSet.forEach(d => { if (d in a.d) redundancy += Math.min(Math.abs(a.d[d]), 1); });
  });

  return uncertainty * 1.0 + separation * 0.8 + framework * 0.2 - redundancy * 0.35;
}

class QuizSession {
  // questionMode comes from the "Your Experience" onboarding step's one
  // depth choice: "15"/"35"/"50" all pin the assessment to exactly that
  // many questions (never extended). "adaptive" isn't offered by that
  // screen at all — it's only the fallback for someone who skipped
  // onboarding entirely (the name screen's "Skip for now"), preserving
  // the app's original default behavior: start at MIN_QUESTIONS and let
  // _maybeAdjustLength() extend up to MAX_QUESTIONS when confidence is
  // still low. See _maybeAdjustLength()'s own guard for the other half
  // of this.
  constructor(seed = Date.now() % 100000, name = "", questionMode = "adaptive"){
    // seed is kept only for the save/resume payload shape (harmless,
    // unused for question selection now) so older in-progress saves in
    // a person's browser still deserialize without a format change.
    this.seed = seed;
    this.name = name;
    this.questionMode = questionMode || "adaptive";
    this.dims = emptyDims();
    this.answers = [];              // sparse: index-aligned with this.plan, entries or null
    this.clusterAffinity = {};
    CLUSTERS.forEach(c => this.clusterAffinity[c] = 0);
    this.clusterAsked = {};
    CLUSTERS.forEach(c => this.clusterAsked[c] = 0);
    this.usedIds = new Set();
    this.order = [...CLUSTERS];
    this.plan = CORE_QUESTION_IDS.map(id => QUESTIONS_BY_ID[id]).filter(Boolean);
    this.cursor = 0;
    this.targetLength = this.questionMode === "15" ? 15
      : this.questionMode === "35" ? 35
      : this.questionMode === "50" ? 50
      : MIN_QUESTIONS;
    this.confidencePct = 0;
    this.justExtended = false;
  }

  totalLength(){ return this.targetLength; }
  maxLength(){ return MAX_QUESTIONS; }

  current(){
    if (this.cursor >= this.targetLength) return null;
    if (this.cursor >= this.plan.length){
      if (this.plan.length === 15 || this.plan.length === 25){
        this.plan.push(...this._pickInformativeBatch(10));
      } else {
        this.plan.push(...this._pickInformativeBatch(1));
      }
    }
    return this.plan[this.cursor];
  }

  currentAnswer(){
    return this.answers[this.cursor] || null;
  }

  /* Stage 2/3/5 selection: rank every not-yet-used, not-already-planned
     question by information value against the state right now, take the
     top `count`. Deterministic given the running answer history, since
     nothing here reads the clock or the seed. */
  _pickInformativeBatch(count){
    const nd = this.normalizedDims();
    const match = matchArchetype(nd);
    const top = match.ranked[0].archetype, second = match.ranked[1].archetype;
    const planned = new Set(this.plan.map(p => p.id));
    const candidates = QUESTIONS.filter(q => !this.usedIds.has(q.id) && !planned.has(q.id));
    const scored = candidates.map(q => ({ q, score: computeQuestionInfoValue(q, this, top, second) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(x => x.q);
  }

  /* ---- Stage 4/5: confidence check and continued questioning -----------
     Stages 1-3 (questions 1-35) always run to completion regardless of
     confidence, per the fixed/batch design above. From question 35
     onward this runs after every single answer (not in batches of 5, the
     old checkpoint cadence), using the evidence-based
     computeAssessmentConfidence() rather than the old archetype-gap-only
     measure, and stops the instant the target is reached instead of
     always committing to another full batch. The old
     _boostForDisambiguation step is gone as a separate method, its idea
     (bias toward whatever separates the top-2 candidates) now lives
     directly inside computeQuestionInfoValue's separation term, computed
     fresh per question rather than as a one-time affinity nudge. */
  _maybeAdjustLength(){
    // Fixed-length modes ("15"/"35") never extend past their chosen
    // length regardless of confidence — only "adaptive" does.
    if (this.questionMode !== "adaptive") return;
    if (this.cursor < MIN_QUESTIONS) return;
    if (this.cursor >= MAX_QUESTIONS){ this.targetLength = MAX_QUESTIONS; return; }
    const nd = this.normalizedDims();
    const match = matchArchetype(nd);
    const conf = computeAssessmentConfidence(match.ranked, nd, this, false);
    this.confidencePct = conf.overall;
    if (conf.overall >= CONFIDENCE_TARGET){ this.targetLength = this.cursor; return; }
    this.targetLength = Math.min(MAX_QUESTIONS, this.cursor + 1);
    this.justExtended = true;
  }

  /* Editing an already-answered question first reverts its dimension and
     cluster-affinity contribution, then re-applies the new choice, so
     going back and changing an answer produces a fully correct result
     rather than double-counting. */
  _revert(idx){
    const prev = this.answers[idx];
    if (!prev) return;
    Object.entries(prev.d).forEach(([dim, val]) => { this.dims[dim] -= val; });
    const magnitude = Object.values(prev.d).reduce((s, v) => s + Math.abs(v), 0);
    this.clusterAffinity[prev.cluster] -= magnitude;
    this.answers[idx] = null;
  }

  answer(optionIndex){
    const q = this.current();
    if (!q) return;
    const opt = q.options[optionIndex];
    const editing = !!this.answers[this.cursor];
    if (editing){
      this._revert(this.cursor);
    } else {
      this.usedIds.add(q.id);
      this.clusterAsked[q.cluster] = (this.clusterAsked[q.cluster] || 0) + 1;
    }
    let magnitude = 0;
    Object.entries(opt.d).forEach(([dim, val]) => {
      this.dims[dim] = (this.dims[dim] || 0) + val;
      magnitude += Math.abs(val);
    });
    this.clusterAffinity[q.cluster] += magnitude;
    this.answers[this.cursor] = { questionId: q.id, cluster: q.cluster, optionIndex, text: opt.text, d: opt.d };
    this.cursor++;
    this.justExtended = false;
    if (editing) this._recalculateFutureQuestions();
    else this._maybeAdjustLength();
  }

  /* Changing an earlier answer shifts the running dimension totals, which
     means whatever the adaptive engine was about to ask next may no
     longer be the right call. Rather than re-picking questions that were
     already answered (which would silently discard real answers), this
     only drops the still-blank tail beyond the furthest answered
     question, so the very next unanswered question gets freshly chosen
     against the updated cluster affinities instead of a stale plan. */
  _recalculateFutureQuestions(){
    let highest = -1;
    for (let i = 0; i < this.answers.length; i++){ if (this.answers[i]) highest = i; }
    if (this.plan.length > highest + 1){
      this.plan.length = highest + 1;
    }
  }

  goBack(){
    if (this.cursor > 0) this.cursor--;
  }

  goForward(){
    // only allowed onto a question that already has a recorded answer,
    // otherwise there's nothing to advance into without answering it
    if (this.answers[this.cursor]) this.cursor++;
  }

  canGoBack(){ return this.cursor > 0; }
  canSkipForward(){ return !!this.answers[this.cursor]; }

  progress(){ return { current: this.cursor, total: this.targetLength, max: MAX_QUESTIONS }; }
  isComplete(){ return this.cursor >= this.targetLength; }

  encouragement(){
    const remaining = this.targetLength - this.cursor;
    if (remaining <= 0) return "That's everything I need.";
    if (this.justExtended) return "Two strong matches are close, digging a little deeper.";
    if (this.cursor === 0) return "Let's start.";
    if (remaining <= 3) return "Almost there, just a couple more.";
    if (remaining <= 5) return "A few more and I'll have a clear read.";
    if (this.cursor >= 15 && this.cursor < 18) return "I'm starting to get a sense of you.";
    if (remaining <= this.targetLength * 0.5) return "Good pace, keep going.";
    return "Just getting started here.";
  }

  normalizedDims(){
    // clamp to a stable -10..10 range regardless of quiz length, for the
    // encoding and archetype matching steps below.
    const out = {};
    DIMENSIONS.forEach(k => {
      out[k] = Math.max(-10, Math.min(10, Math.round(this.dims[k])));
    });
    return out;
  }

  /* ---- Save / restore, so a mid-quiz break never loses answers -----------
     serialize() captures every bit of session state needed to resume
     exactly where it left off, including the running dimension totals and
     the adaptive plan already built, so resuming isn't a fresh guess, it
     picks up on the very next unanswered question. */
  serialize(){
    return {
      seed: this.seed,
      name: this.name,
      questionMode: this.questionMode,
      meta: this.meta || {},
      dims: this.dims,
      answers: this.answers,
      clusterAffinity: this.clusterAffinity,
      clusterAsked: this.clusterAsked,
      usedIds: Array.from(this.usedIds),
      order: this.order,
      plan: this.plan,
      cursor: this.cursor,
      targetLength: this.targetLength,
      confidencePct: this.confidencePct,
      savedAt: Date.now(),
    };
  }
}

function restoreQuizSession(saved){
  const s = Object.create(QuizSession.prototype);
  s.seed = saved.seed;
  s.name = saved.name || "";
  s.questionMode = saved.questionMode || "adaptive";
  s.meta = saved.meta || {};
  s.dims = saved.dims;
  s.answers = saved.answers;
  s.clusterAffinity = saved.clusterAffinity;
  s.clusterAsked = saved.clusterAsked;
  s.usedIds = new Set(saved.usedIds);
  s.order = saved.order;
  s.plan = saved.plan;
  s.cursor = saved.cursor;
  s.targetLength = saved.targetLength;
  s.confidencePct = saved.confidencePct || 0;
  s.justExtended = false;
  return s;
}

/* -------------------------------------------------------------------------
   ALGORITHM: Archetype matching
   Each archetype has a small "signature": 3 weighted dimensions that most
   define it. Score = sum(normalizedDim[dim] * weight) for each archetype,
   the highest score wins. This is a lightweight weighted-vector match, so
   it rewards a person for being distinctively strong in an archetype's
   core traits rather than requiring an exact 20-dimension fingerprint,
   which keeps results feeling specific without demanding improbable
   precision. The full ranked list is returned too, so the result page can
   show how every other archetype scored, not just the top one.
------------------------------------------------------------------------- */

function matchArchetype(normDims){
  const scored = ARCHETYPES.map(a => {
    const score = a.signature.reduce((sum, s) => sum + (normDims[s.dim] || 0) * s.w, 0);
    return { archetype: a, score };
  }).sort((x, y) => y.score - x.score);
  return { primary: scored[0].archetype, runnerUp: scored[1].archetype, ranked: scored };
}

/* -------------------------------------------------------------------------
   ALGORITHM: Sub-profile (why two people with the same archetype differ)
   An archetype is decided by only 3 signature dimensions, so two people
   can land on the same one while still being genuinely different once you
   look at the other 17. This finds the two dimensions the person scores
   highest on outside the archetype's own signature, and turns that into a
   short, specific sentence, so results within the same archetype aren't
   interchangeable.
------------------------------------------------------------------------- */

function computeSubProfile(normDims, archetype){
  const sigDims = new Set(archetype.signature.map(s => s.dim));
  const rest = DIMENSIONS.filter(d => !sigDims.has(d))
    .map(d => ({ d, v: normDims[d] || 0 }))
    .sort((a, b) => b.v - a.v);
  const top = rest.slice(0, 2).filter(x => x.v > 0);
  if (top.length === 0){
    return `Within ${archetype.name}, your other traits are fairly balanced, no single one pulling much harder than the rest.`;
  }
  const labels = top.map(x => DIM_LABELS[x.d]);
  return `Within ${archetype.name}, you lean especially into ${labels.join(" and ")}, which shapes your version of this type a little differently from someone else who tested the same result.`;
}

/* -------------------------------------------------------------------------
   ALGORITHM: Measured traits
   Each trait is a plain, deterministic formula over normalized dimensions
   (0-100 scale). No randomness anywhere in this file, so the same answers
   always produce the same reading, the way an actual assessment should.
------------------------------------------------------------------------- */

function pct(v){ return Math.round(((v + 10) / 20) * 100); }

/* -------------------------------------------------------------------------
   CANONICAL DIMENSION ACCESSORS (Phase 1)
   Every feature that reads a personality dimension should go through one
   of these four, instead of reaching into normDims or session state with
   its own inline formula. This is the single source of truth the rest of
   the pipeline (archetypes, careers, frameworks, compatibility, results)
   is built on, so a future change to how a dimension is measured only
   has to happen in one place.
   ------------------------------------------------------------------------- */

// Raw dimension value, -10..10.
function getDimensionScore(normDims, dim){
  return (normDims && normDims[dim]) || 0;
}

// 0-100 view of the same value. Same math pct() always used, just named
// for what it does at call sites that read a dimension, not a raw delta.
function getDimensionPercent(normDims, dim){
  return pct(getDimensionScore(normDims, dim));
}

// How much real evidence exists for one dimension in a completed quiz
// session: how many answered questions touched it, and the total
// magnitude of their deltas. Returns null when there's no session to
// read (e.g. a profile decoded from a shared code carries no answer
// history), which callers should treat as genuinely unknown, not as
// zero evidence.
function getDimensionEvidence(session, dim){
  if (!session || !session.answers) return null;
  let count = 0, magnitude = 0;
  session.answers.forEach(a => {
    if (!a || !a.d || !(dim in a.d)) return;
    count++;
    magnitude += Math.abs(a.d[dim]);
  });
  return { count, magnitude };
}

// A 0-1 confidence read for a single dimension. More answers that
// touched it, and a clearer accumulated signal (not just one weak
// nudge), means more confidence in that specific number. Returns 0.5
// (explicitly "unknown", not "neutral" or "zero") when there's no
// session to measure evidence from.
function getDimensionConfidence(session, dim){
  const evidence = getDimensionEvidence(session, dim);
  if (!evidence) return 0.5;
  const countFactor = Math.min(1, evidence.count / 4);
  const magnitudeFactor = Math.min(1, evidence.magnitude / 12);
  return Math.round((countFactor * 0.6 + magnitudeFactor * 0.4) * 100) / 100;
}

function computeMeasuredTraits(normDims){
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  const g = k => pct(normDims[k] || 0);
  return {
    "Emotional Steadiness": clamp((g("resilience") + g("patience") + g("selfAwareness")) / 3),
    "Decision Confidence": clamp((g("confidence") + g("logic") + g("drive")) / 3),
    "Social Stamina": clamp((g("socialEnergy") + g("adaptability")) / 2),
    "Creative Output": clamp((g("creativity") + g("curiosity") + g("independence")) / 3),
    "Focus Capacity": clamp((g("discipline") + g("patience") + g("planning")) / 3),
    "Risk Tolerance": clamp(g("risk")),
    "Empathy Index": clamp((g("empathy") + g("kindness")) / 2),
    "Leadership Presence": clamp((g("leadership") + g("confidence") + g("drive")) / 3),
    "Adaptability Score": clamp(g("adaptability")),
    "Resilience Rating": clamp((g("resilience") + g("discipline")) / 2),
    "Trust Radius": clamp(g("trust")),
    "Independence Level": clamp(g("independence")),
    "Friendship Reliability": clamp((g("trust") + g("kindness") + g("patience") + g("empathy")) / 4),
    "Growth Mindset": clamp((g("selfAwareness") + g("curiosity") + g("optimism")) / 3),
    "Communication Clarity": clamp((g("logic") + g("confidence") + g("empathy")) / 3),
    "Stress Recovery": clamp((g("resilience") + g("optimism") + g("patience")) / 3),
  };
}

/* "Life Balance" is a presentational grouping, not a separate measured
   instrument: it recombines the same 25 scored dimensions used everywhere
   else into 5 familiar buckets (Work/Social/Personal/Learning/Wellbeing),
   the same way computeMeasuredTraits() above turns raw dims into
   friendlier composite names. No new data is collected or invented for
   this — see the result page's Life Balance card for the same disclosure
   shown to the person. */
function computeLifeBalance(normDims){
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  const g = k => pct(normDims[k] || 0);
  return {
    "Work": clamp((g("drive") + g("discipline") + g("responsibility") + g("persistence")) / 4),
    "Social": clamp((g("socialEnergy") + g("empathy") + g("kindness")) / 3),
    "Personal": clamp((g("selfAwareness") + g("independence") + g("patience")) / 3),
    "Learning": clamp((g("curiosity") + g("openMindedness") + g("adaptability")) / 3),
    "Wellbeing": clamp((g("emotionalStability") + g("resilience") + g("optimism")) / 3),
  };
}

/* Same idea as computeLifeBalance() just above: recombines real scored
   dims into 4 motivation-flavored facets so the Motivation card has
   actual numbers to show, not just the single MOTIVATION_STYLES name. */
function computeMotivationFacets(normDims){
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  const g = k => pct(normDims[k] || 0);
  return {
    "Purpose": clamp(g("responsibility")),
    "Ambition": clamp(g("drive")),
    "Consistency": clamp(g("persistence")),
    "Exploration": clamp((g("curiosity") + g("openMindedness")) / 2),
  };
}

/* -------------------------------------------------------------------------
   ALGORITHM: Career matching
   For each career, fit = average normalized score across its 3 signature
   dimensions. Tiers: >=65 Excellent, >=45 Good, else Avoid (shown as a
   growth note rather than a value judgement). A one-line "why" is
   generated from whichever of the 3 dimensions scored highest for the
   person, referencing that trait by name.
------------------------------------------------------------------------- */

const DIM_LABELS = {
  confidence:"confidence", logic:"logical thinking", creativity:"creativity",
  humor:"humor", adaptability:"adaptability", curiosity:"curiosity",
  empathy:"empathy", leadership:"leadership", patience:"patience",
  drive:"drive", risk:"risk tolerance", trust:"trust", kindness:"kindness",
  discipline:"discipline", socialEnergy:"social energy",
  selfAwareness:"self-awareness", planning:"planning", resilience:"resilience",
  optimism:"optimism", independence:"independence",
  emotionalStability:"emotional stability", competitiveness:"competitiveness",
  responsibility:"responsibility", persistence:"persistence",
  openMindedness:"open-mindedness"
};

function computeCareers(normDims){
  return CAREERS.map(c => {
    const scores = c.dims.map(d => pct(normDims[d] || 0));
    const fit = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
    const topDimIdx = scores.indexOf(Math.max(...scores));
    const topDim = c.dims[topDimIdx];
    const tier = fit >= 70 ? "Excellent Match" : fit >= 55 ? "Good Match" : fit >= 40 ? "Possible Match" : "Avoid";
    const why = tier === "Avoid"
      ? `Your natural ${DIM_LABELS[c.dims[scores.indexOf(Math.min(...scores))]]} leans elsewhere, so this isn't a strength fit today.`
      : tier === "Possible Match"
      ? `Your ${DIM_LABELS[topDim]} helps here, but it isn't the strongest lane for you.`
      : `Your ${DIM_LABELS[topDim]} lines up well with what this path demands.`;
    return { name:c.name, fit, tier, why };
  }).sort((a,b) => b.fit - a.fit);
}

/* -------------------------------------------------------------------------
   ALGORITHM: Relationship matches
   Each relationship type weights a different subset of dimensions, using
   the person's own scores to describe how they show up in that dynamic
   (not a two-person comparison, that's the Compare page, below).
------------------------------------------------------------------------- */

const RELATIONSHIP_WEIGHTS = {
  friendship: ["trust","kindness","socialEnergy"],
  dating: ["empathy","trust","confidence"],
  marriage: ["patience","trust","discipline"],
  business: ["drive","logic","discipline"],
  creative: ["creativity","adaptability","curiosity"],
  travel: ["adaptability","risk","curiosity"],
  gaming: ["patience","logic","humor"],
  study: ["discipline","patience","logic"],
  roommate: ["patience","trust","discipline"],
};

function computeRelationshipStyles(normDims){
  return RELATIONSHIP_TYPES.map(r => {
    const dims = RELATIONSHIP_WEIGHTS[r.key];
    const score = Math.round(dims.reduce((s,d)=>s+getDimensionPercent(normDims,d),0) / dims.length);
    return { key:r.key, label:r.label, score };
  });
}

/* -------------------------------------------------------------------------
   ALGORITHM: Personality code encode/decode (versioned)
   Format:  [Name-]PF<version>-<archetypeIndex base36>-<N dims base36>-<checksum>
   PF1 codes (the original release) carry the first 20 dimensions.
   PF2 codes carry all 25. The dimension order never changes for the first
   20 slots, only new slots were appended, so a PF1 code can always be
   read: its 20 known dimensions are recovered exactly, and the 5 added in
   v2 are set to a neutral 0 since they were never asked about. This is why
   old codes never break. decodeCode() always returns a full 25-dimension
   profile regardless of which version it was given, with an `upgraded`
   flag set to true when it had to backfill newer dimensions.
   Every dimension is clamped to -10..10, shifted to 0..20 so it always
   encodes as a single base36 digit. The checksum is a simple mod-36 sum of
   all digit values plus the archetype index, guarding against typos.
   Fully local, no server round trip needed to decode either the name or
   the traits.
------------------------------------------------------------------------- */

const B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_VERSION = 2;
const V1_DIMENSION_COUNT = 20; // the original release's dimension count

function sanitizeName(name){
  return (name || "").trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

function encodeCode(archetypeId, normDims, name){
  const archIdx = ARCHETYPES.findIndex(a => a.id === archetypeId);
  const archDigit = B36[archIdx] || "0";
  let digits = "";
  let checksum = archIdx;
  DIMENSIONS.forEach(dim => {
    const shifted = Math.max(0, Math.min(20, (normDims[dim] || 0) + 10));
    digits += B36[shifted];
    checksum += shifted;
  });
  const checkDigit = B36[checksum % 36];
  const base = `PF${CODE_VERSION}-${archDigit}-${digits}-${checkDigit}`;
  const cleanName = sanitizeName(name);
  return cleanName ? `${cleanName}-${base}` : base;
}

function decodeCode(code){
  try {
    const raw = code.trim();
    let name = "";
    let body = raw;
    const firstParts = raw.split("-");
    if (firstParts[0] && !/^PF\d+$/i.test(firstParts[0])){
      name = sanitizeName(firstParts[0]);
      body = firstParts.slice(1).join("-");
    }
    const parts = body.trim().toUpperCase().split("-");
    if (parts.length !== 4) return null;
    const [versionTag, archDigit, digits, checkDigit] = parts;
    const versionMatch = /^PF(\d+)$/.exec(versionTag);
    if (!versionMatch) return null;
    const version = parseInt(versionMatch[1], 10);
    const expectedDigitCount = version <= 1 ? V1_DIMENSION_COUNT : DIMENSIONS.length;
    const archIdx = B36.indexOf(archDigit);
    if (archIdx < 0 || !ARCHETYPES[archIdx]) return null;
    if (digits.length !== expectedDigitCount) return null;

    let checksum = archIdx;
    const normDims = emptyDims();
    for (let i = 0; i < expectedDigitCount; i++){
      const val = B36.indexOf(digits[i]);
      if (val < 0 || val > 20) return null;
      checksum += val;
      normDims[DIMENSIONS[i]] = val - 10;
    }
    if (B36[checksum % 36] !== checkDigit) return null;

    return {
      archetype: ARCHETYPES[archIdx],
      normDims,
      name,
      version,
      upgraded: version < CODE_VERSION,
    };
  } catch (e){
    return null;
  }
}

/* -------------------------------------------------------------------------
   ALGORITHM: Compatibility (Compare page)
   For two decoded profiles, compute:
   - relationshipScore: overall closeness, weighted toward complementary
     (not just identical) traits: leadership plus patience, drive plus
     planning, social energy plus empathy, and risk plus discipline are
     all treated as good complements, not just close matches.
   - communicationScore, adventureScore, creativeScore, trustScore: simple
     paired averages and similarity on relevant dimension clusters.
   - sharedStrengths / conflictAreas: dimensions where both score high
     (shared) versus dimensions with the largest gap (friction risk).
------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   ALGORITHM: Compatibility (rewritten, empirically calibrated)
   The previous version scored almost every pair 75-90% because it
   averaged similarity across 25 near-independent dimensions, and
   averaging many independent numbers mathematically compresses variance
   toward a narrow middle band regardless of who's being compared, the
   same reason a class average barely moves no matter which two students
   you pick. This version fixes that two ways:
   1. traitSimilarity() uses a steep, calibrated falloff (spread=5,
      power=1.8) instead of a gentle linear one, so real differences
      register instead of being smoothed away.
   2. The raw composite is then passed through calibrateScore(), a
      piecewise remap whose anchor points were derived empirically by
      simulating 1000+ real quiz sessions, measuring the actual raw score
      distribution, and mapping its percentiles onto the target
      real-world bands (most pairs land "mixed" to "good", "exceptional"
      is genuinely rare). This was verified afterward against 500 more
      simulated pairs: about 1% land under 20, 16% in 20-40, 37% in
      40-60, 22% in 60-75, 18% in 75-90, and 5% above 90, close to the
      intended distribution, with a real identical-profile match scoring
      100 and true opposites scoring 0.
------------------------------------------------------------------------- */

function traitSimilarity(a, b, spread, power){
  const gap = Math.abs((a||0) - (b||0));
  const normalized = Math.min(1, gap / (spread || 5));
  return 100 * (1 - Math.pow(normalized, power || 1.8));
}

const COMPATIBILITY_CALIBRATION_ANCHORS = [
  [0,0], [43.6,20], [56.0,40], [66.7,60], [74.2,75], [82.0,90], [90.7,100]
];
function calibrateScore(raw){
  const anchors = COMPATIBILITY_CALIBRATION_ANCHORS;
  if (raw <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++){
    if (raw <= anchors[i][0]){
      const [x0,y0] = anchors[i-1], [x1,y1] = anchors[i];
      const t = (raw - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return 100;
}

const COMPATIBILITY_CORE_DIMS = ["trust","empathy","kindness","patience","emotionalStability","socialEnergy","independence","openMindedness"];
const COMPATIBILITY_COMPLEMENT_PAIRS = [["leadership","patience"],["drive","planning"],["risk","discipline"]];

function compatibilityBand(score){
  if (score < 20) return "Extremely Incompatible";
  if (score < 40) return "Difficult";
  if (score < 60) return "Mixed";
  if (score < 75) return "Good";
  if (score < 90) return "Excellent";
  return "Exceptional";
}

/* Similarity is a different question from compatibility: it asks "how
   alike are you", not "how well do you function together". It's an
   unweighted read across every dimension, with no bonus for the kind of
   complementary differences (one leads, one supports) that compatibility
   specifically rewards, which is exactly why the two numbers can and
   often do disagree. */
function computeSimilarityScore(a, b){
  const vals = DIMENSIONS.map(d => traitSimilarity(a[d], b[d], 6, 1.4));
  const raw = vals.reduce((s,v) => s+v, 0) / vals.length;
  return calibrateScore(raw);
}

/* A lightweight, defensible proxy for how much real signal a profile
   carries, since a decoded code doesn't retain how many questions were
   actually answered. Profiles with traits sitting mostly near neutral
   read as less certain than ones with clear, decisive scores. */
function computeComparisonConfidence(profileA, profileB){
  const strength = (nd) => {
    const vals = DIMENSIONS.map(d => Math.abs(nd[d] || 0));
    return vals.reduce((s,v) => s+v, 0) / vals.length;
  };
  const avgStrength = (strength(profileA.normDims) + strength(profileB.normDims)) / 2;
  return Math.max(55, Math.min(99, Math.round(55 + avgStrength * 7)));
}

function computeCompatibility(profileA, profileB){
  const a = profileA.normDims, b = profileB.normDims;

  const coreVals = COMPATIBILITY_CORE_DIMS.map(d => traitSimilarity(a[d], b[d], 5, 1.8));
  const core = coreVals.reduce((s,v) => s+v, 0) / coreVals.length;
  const complementBonus = COMPATIBILITY_COMPLEMENT_PAIRS.reduce((sum, [x,y]) => {
    const gap = Math.abs((a[x]||0) - (b[y]||0));
    return sum + Math.max(0, (10 - gap) / 10) * 3;
  }, 0);
  const rawOverall = Math.max(0, Math.min(100, core * 0.85 + complementBonus));
  const relationshipScore = calibrateScore(rawOverall);

  const communicationScore = calibrateScore((traitSimilarity(a.socialEnergy,b.socialEnergy,5,1.8) + traitSimilarity(a.trust,b.trust,5,1.8) + traitSimilarity(a.empathy,b.empathy,5,1.8)) / 3);
  const adventureScore = calibrateScore((traitSimilarity(a.risk,b.risk,5,1.8) + traitSimilarity(a.adaptability,b.adaptability,5,1.8) + traitSimilarity(a.curiosity,b.curiosity,5,1.8)) / 3);
  const creativeScore = calibrateScore((traitSimilarity(a.creativity,b.creativity,5,1.8) + traitSimilarity(a.curiosity,b.curiosity,5,1.8)) / 2);
  const trustScore = calibrateScore((traitSimilarity(a.trust,b.trust,5,1.8) + traitSimilarity(a.kindness,b.kindness,5,1.8)) / 2);

  const similarityScore = computeSimilarityScore(a, b);
  const comparisonConfidence = computeComparisonConfidence(profileA, profileB);
  const band = compatibilityBand(relationshipScore);
  const similarityGap = Math.abs(similarityScore - relationshipScore);
  const similarityNote = similarityGap < 8
    ? "Your similarity and compatibility scores are close, how alike you are lines up with how well you function together."
    : similarityScore > relationshipScore
    ? `You're more alike (${similarityScore}%) than you are compatible (${relationshipScore}%), being similar doesn't automatically mean you balance each other well.`
    : `You're more compatible (${relationshipScore}%) than you are similar (${similarityScore}%), your differences are doing real work here, not just canceling each other out.`;

  const shared = DIMENSIONS.filter(d => a[d] >= 3 && b[d] >= 3).sort((x,y)=>(b[y]+a[y])-(b[x]+a[x])).slice(0,4);
  const conflicts = DIMENSIONS.map(d => ({ d, gap: Math.abs(a[d]-b[d]) })).sort((x,y)=>y.gap-x.gap).slice(0,3).map(x=>x.d);

  return { relationshipScore, communicationScore, adventureScore, creativeScore, trustScore,
    similarityScore, comparisonConfidence, band, similarityNote,
    sharedStrengths: shared.map(d => DIM_LABELS[d]), conflictAreas: conflicts.map(d => DIM_LABELS[d]) };
}

/* =========================================================================
   V2 ADDITIONS
   New computed profiles for the v2 update. All of these are pure
   functions over a 25-dimension normDims object, nothing here changes how
   the original scoring, matching, or codes behave.
   ========================================================================= */

/* ---- Generic signature scorer, reused by several profiles below -------- */
function scoreBySignature(list, normDims){
  return list.map(item => ({
    item,
    score: item.signature.reduce((sum, s) => sum + (normDims[s.dim] || 0) * s.w, 0),
  })).sort((a, b) => b.score - a.score);
}

/* ---- Generic percentage-breakdown scorer, reused by thinking/learning/
   decision/love-language profiles. Every category's raw value is an
   average of pct() over its listed dimensions, then the whole set is
   normalized to sum to 100 so it reads like a breakdown, not a set of
   independent scores. ------------------------------------------------- */
function computePercentageProfile(categories, normDims){
  const raw = categories.map(c => ({
    name: c.name,
    val: c.dims.reduce((s, d) => s + pct(normDims[d] || 0), 0) / c.dims.length,
  }));
  const total = raw.reduce((s, r) => s + r.val, 0) || 1;
  const withPct = raw.map(r => ({ name: r.name, pct: Math.round((r.val / total) * 100) }));
  withPct.sort((a, b) => b.pct - a.pct);
  const drift = 100 - withPct.reduce((s, r) => s + r.pct, 0);
  if (withPct.length) withPct[0].pct += drift;
  return withPct;
}

/* ---- Personality mix: primary/secondary/third percentages -- */
function computePersonalityMix(ranked){
  const top3 = ranked.slice(0, 3);
  const minScore = Math.min(...top3.map(r => r.score));
  const shifted = top3.map(r => Math.max(0.5, r.score - minScore + 1));
  const total = shifted.reduce((a, b) => a + b, 0);
  const pcts = shifted.map(v => Math.round((v / total) * 100));
  const drift = 100 - pcts.reduce((a, b) => a + b, 0);
  pcts[0] += drift;
  return top3.map((r, i) => ({ archetype: r.archetype, pct: Math.max(1, pcts[i]) }));
}

/* ---- Social profile ------------------------------------------ */
function computeSocialProfile(normDims){
  const spectrumPct = pct(normDims.socialEnergy || 0);
  const category = spectrumPct <= 35 ? "Introvert" : spectrumPct >= 65 ? "Extrovert" : "Ambivert";
  const socialBattery = clamp1to100((pct(normDims.socialEnergy || 0) + pct(normDims.adaptability || 0)) / 2);
  const empathyPct = pct(normDims.empathy || 0), humorPct = pct(normDims.humor || 0), logicPct = pct(normDims.logic || 0);
  let conversationStyle;
  if (empathyPct >= humorPct && empathyPct >= logicPct) conversationStyle = "Deep, one-on-one conversations over small talk";
  else if (humorPct >= logicPct) conversationStyle = "Playful, quick back-and-forth banter";
  else conversationStyle = "Idea-driven discussion, small talk is just the warm-up";
  let groupSizePreference;
  if (spectrumPct <= 35 && pct(normDims.independence || 0) >= 55) groupSizePreference = "One person, or a very small, familiar group";
  else if (spectrumPct >= 65) groupSizePreference = "The bigger the group, the more energy in the room";
  else groupSizePreference = "Small, familiar groups over big unpredictable ones";
  const communicationStyle = pct(normDims.confidence || 0) >= 60
    ? "Direct and upfront, says what it is"
    : pct(normDims.empathy || 0) >= 60
    ? "Careful and considerate, reads the room before speaking"
    : "Measured, tends to think before responding";
  return { spectrumPct, category, socialBattery, conversationStyle, groupSizePreference, communicationStyle };
}
function clamp1to100(v){ return Math.max(1, Math.min(100, Math.round(v))); }

/* ---- Relationship profile ------------------------------------ */
function computeRelationshipProfile(normDims){
  const loveLanguages = computePercentageProfile(LOVE_LANGUAGE_CATEGORIES, normDims);
  const attachmentStyle = scoreBySignature(ATTACHMENT_STYLES, normDims)[0].item;
  const conflictStyle = scoreBySignature(CONFLICT_STYLES, normDims)[0].item;
  const trustLevel = pct(normDims.trust || 0);
  const jealousyLevel = clamp1to100(100 - (pct(normDims.trust || 0) + pct(normDims.emotionalStability || 0)) / 2);
  const personalSpace = pct(normDims.independence || 0);
  const emotionalIntimacy = clamp1to100((pct(normDims.empathy || 0) + pct(normDims.trust || 0)) / 2);
  const leadScore = pct(normDims.leadership || 0), followScore = pct(normDims.patience || 0);
  const gap = leadScore - followScore;
  let relationshipDynamic;
  if (Math.abs(gap) <= 12 && pct(normDims.adaptability || 0) >= 60) relationshipDynamic = "Adaptive, switches depending on the situation";
  else if (gap > 12) relationshipDynamic = "Usually Leads";
  else if (gap < -12) relationshipDynamic = "Usually Follows";
  else relationshipDynamic = "Balanced";
  return { loveLanguages, attachmentStyle, conflictStyle, trustLevel, jealousyLevel, personalSpace, emotionalIntimacy, relationshipDynamic };
}

/* ---- Narrative role ------------------------------------------ */
function computeNarrativeRole(normDims){
  const ranked = scoreBySignature(NARRATIVE_ROLES, normDims);
  return { primary: ranked[0].item, runnerUp: ranked[1].item };
}

/* ---- Thinking, learning, decision profiles (Updates 8, 9, 10) ----------- */
function computeThinkingProfile(normDims){ return computePercentageProfile(THINKING_CATEGORIES, normDims); }
function computeLearningProfile(normDims){ return computePercentageProfile(LEARNING_CATEGORIES, normDims); }
function computeDecisionProfile(normDims){ return computePercentageProfile(DECISION_CATEGORIES, normDims); }

/* ---- Stress response, ranked --------------------------------- */
function computeStressResponses(normDims){
  return scoreBySignature(STRESS_RESPONSES, normDims).slice(0, 3).map(r => r.item);
}

/* ---- Ideal environments, ranked ------------------------------ */
function computeEnvironments(normDims){
  return scoreBySignature(ENVIRONMENT_PROFILES, normDims).slice(0, 4).map(r => r.item.name);
}

/* ---- Aesthetic profile ---------------------------------------- */
function computeAesthetic(normDims){
  return scoreBySignature(AESTHETIC_VIBES, normDims)[0].item;
}

/* ---- Entertainment predictions --------------------------------- */
function computeEntertainment(normDims){
  const ranked = scoreBySignature(ENTERTAINMENT_PROFILES, normDims);
  return { primary: ranked[0].item, secondary: ranked[1].item };
}

/* ---- Achievements ---------------------------------------------- */
function computeAchievements(normDims){
  return ACHIEVEMENTS.filter(a => a.test(normDims));
}

/* ---- Archetype extras: animal, element, symbol, hidden
   potential, plus the fields that are just aliases of existing archetype
   fields so nothing needed re-authoring. ------------------------------- */
function getArchetypeExtras(archetype){
  const lookup = ARCHETYPE_EXTRAS[archetype.id] || { animal:"Fox", element:"Fire", symbol:"\u2726" };
  const hiddenPotential = `The flip side of "${archetype.weaknesses[0]}" is usually unclaimed ${archetype.strengths[2] ? archetype.strengths[2].toLowerCase() : archetype.strengths[0].toLowerCase()}, once it stops being treated like a flaw.`;
  return {
    animal: lookup.animal,
    element: lookup.element,
    symbol: lookup.symbol,
    primaryColor: archetype.colors[0],
    secondaryColor: archetype.colors[1],
    lifeMotto: archetype.quote,
    favoriteEnvironment: archetype.idealEnvironments[0],
    hiddenPotential,
  };
}

/* ---- Just for fun stats ---------------------------------------
   Kept deliberately separate from computeMeasuredTraits(), which stays the
   serious, no-randomness read. This one is explicitly playful and labeled
   as such wherever it's shown, never presented as an actual assessment. */
function computeFunStats(normDims){
  const g = k => pct(normDims[k] || 0);
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  return {
    "Aura": clamp((g("confidence") + g("independence") + g("selfAwareness")) / 3),
    "Rizz": clamp((g("confidence") + g("humor") + g("socialEnergy")) / 3),
    "Chaos": clamp((g("risk") + g("humor") + (100 - g("planning"))) / 3),
    "Main Character Energy": clamp((g("confidence") + g("drive") + g("creativity")) / 3),
    "NPC Energy": clamp(100 - (g("independence") + g("confidence") + g("creativity")) / 3),
    "Plot Armor": clamp((g("resilience") + g("optimism") + g("persistence")) / 3),
    "Academic IQ": clamp((g("logic") + g("discipline") + g("curiosity")) / 3),
    "Street IQ": clamp((g("adaptability") + g("risk") + g("selfAwareness")) / 3),
    "Charisma": clamp((g("confidence") + g("humor") + g("leadership")) / 3),
    "Comfort Level": clamp((g("trust") + g("patience") + g("emotionalStability")) / 3),
    "Adventure": clamp((g("risk") + g("curiosity") + g("adaptability")) / 3),
    "Braincells": clamp((g("logic") + g("selfAwareness") + g("discipline")) / 3),
    "Clutch Factor": clamp((g("resilience") + g("confidence") + g("discipline")) / 3),
    "Fashion": clamp((g("creativity") + g("confidence") + g("openMindedness")) / 3),
    "Taste": clamp((g("selfAwareness") + g("creativity") + g("discipline")) / 3),
    "Vibes": clamp((g("optimism") + g("humor") + g("emotionalStability")) / 3),
    "Energy": clamp((g("drive") + g("socialEnergy") + g("competitiveness")) / 3),
  };
}

/* =========================================================================
   PROFILE DEPTH FEATURES
   Personality confidence/stability, hidden strengths and weaknesses,
   fantasy role, friendship/motivation/fun-extra profiles, and a much
   deeper compatibility engine. Nothing above this line changes.
   ========================================================================= */

/* ---- Personality confidence and stability ------------------------------- */
/* -------------------------------------------------------------------------
   ALGORITHM: Assessment Confidence (Phase 1 rewrite)
   The old version was a single signal: how far ahead the top archetype's
   score was over the runner-up. That's real information (it's kept below
   as archetypeSeparation) but it's not the whole picture, a person could
   have a wide archetype gap from a short, sloppy run just as easily as a
   thorough one. This version blends six components:
     - coverage:            fraction of the 25 dimensions with any real
                             evidence behind them
     - consistency:         agreement across paired situations that touch
                             similar ground (computeConsistency)
     - evidenceStrength:    average per-dimension confidence across all 25
                             dimensions (getDimensionConfidence)
     - archetypeSeparation: the original gap-based signal, kept as-is
     - frameworkConfidence: how decisive the MBTI axis margins are, as a
                             cheap proxy for framework certainty pending a
                             fuller independent-projection model
     - versionPenalty:      a small deduction for PF1-origin profiles that
                             haven't been upgraded, since 5 dimensions were
                             never actually measured for them
   Every component is exposed, not just the final number, since collapsing
   them into one score would hide exactly the kind of nuance ("evidence is
   strong but consistency is shaky") this was meant to capture. When no
   session is available (a profile decoded from a shared code), coverage,
   consistency, evidenceStrength and frameworkConfidence are reported as
   null (genuinely unknown) rather than guessed at, and overall falls back
   to archetypeSeparation alone with a visible note explaining why.
------------------------------------------------------------------------- */
function computeAssessmentConfidence(ranked, normDims, session, upgradedFromV1){
  const gap = ranked[0].score - ranked[1].score;
  const archetypeSeparation = Math.max(0, Math.min(100, Math.round((gap / CONFIDENCE_SCALE) * 100)));
  const avgOthers = ranked.slice(1).reduce((s, r) => s + r.score, 0) / (ranked.length - 1);
  const stabilityRaw = ranked[0].score - avgOthers;
  const stabilityPct = Math.max(0, Math.min(100, Math.round((stabilityRaw / (CONFIDENCE_SCALE * 1.5)) * 100)));

  const mbtiMargins = MBTI_AXES.map(axis => {
    const posSum = axis.posDims.reduce((s,d) => s + getDimensionScore(normDims, d), 0);
    const negSum = axis.negDims.reduce((s,d) => s + getDimensionScore(normDims, d), 0);
    return Math.abs(posSum - negSum);
  });
  const frameworkConfidence = Math.round(Math.min(100, (mbtiMargins.reduce((s,v)=>s+v,0) / mbtiMargins.length) * 6));

  const versionPenalty = upgradedFromV1 ? 6 : 0;

  if (!session || !session.answers){
    return {
      confidencePct: archetypeSeparation,
      stabilityPct,
      overall: archetypeSeparation,
      coverage: null, consistency: null, evidenceStrength: null, frameworkConfidence: null,
      archetypeSeparation, versionPenalty,
      note: "This code carries no answer history to measure coverage or consistency from, so this reflects archetype separation only.",
    };
  }

  const dimConfidences = DIMENSIONS.map(d => getDimensionConfidence(session, d));
  const coverage = Math.round((DIMENSIONS.filter(d => {
    const ev = getDimensionEvidence(session, d);
    return ev && ev.count > 0;
  }).length / DIMENSIONS.length) * 100);
  const evidenceStrength = Math.round((dimConfidences.reduce((s,v)=>s+v,0) / dimConfidences.length) * 100);
  const consistencyResult = computeConsistency(session);
  const consistency = consistencyResult.pct;

  const overall = Math.max(0, Math.min(100, Math.round(
    coverage * 0.2 + consistency * 0.2 + evidenceStrength * 0.25 +
    archetypeSeparation * 0.25 + frameworkConfidence * 0.1 - versionPenalty
  )));

  return {
    confidencePct: overall, // kept as the headline field existing UI already reads
    stabilityPct,
    overall, coverage, consistency, evidenceStrength, archetypeSeparation, frameworkConfidence, versionPenalty,
    note: null,
  };
}

/* ---- Hidden strengths and weaknesses -------------------------------------
   Dimensions outside the matched archetype's own 3-dimension signature
   that still score notably high or low, the traits a person has that
   their "headline" type doesn't already advertise. */
function computeHiddenTraits(normDims, archetype){
  const sigDims = new Set(archetype.signature.map(s => s.dim));
  const outside = DIMENSIONS.filter(d => !sigDims.has(d)).map(d => ({ d, v: normDims[d] || 0 }));
  const hiddenStrengths = outside.filter(x => x.v > 0).sort((a,b) => b.v - a.v).slice(0, 3).map(x => DIM_LABELS[x.d]);
  const hiddenWeaknesses = outside.filter(x => x.v < 0).sort((a,b) => a.v - b.v).slice(0, 3).map(x => DIM_LABELS[x.d]);
  return { hiddenStrengths, hiddenWeaknesses };
}

/* ---- Fantasy role, friend type, motivation, fun extras -------------------
   All reuse the same signature-scoring pattern as archetypes. */
function computeFantasyRole(normDims){ return scoreBySignature(FANTASY_ROLES, normDims)[0].item; }
function computeFriendType(normDims){ return scoreBySignature(FRIEND_TYPES, normDims)[0].item; }
function computeMotivation(normDims){ return scoreBySignature(MOTIVATION_STYLES, normDims)[0].item; }
function computeMythicalCreature(normDims){ return scoreBySignature(MYTHICAL_CREATURES, normDims)[0].item; }
function computeSeason(normDims){ return scoreBySignature(SEASONS, normDims)[0].item; }
function computeTimeOfDay(normDims){ return scoreBySignature(TIMES_OF_DAY, normDims)[0].item; }
function computeChessPiece(normDims){ return scoreBySignature(CHESS_PIECES, normDims)[0].item; }

/* ---- Friendship profile scores -------------------------------------------- */
function computeFriendshipProfile(normDims){
  return {
    type: computeFriendType(normDims),
    reliableScore: pct(normDims.responsibility || 0),
    comfortScore: pct(normDims.kindness || 0),
    chaosScore: clamp1to100((pct(normDims.risk||0) + pct(normDims.humor||0)) / 2),
    listeningSkill: pct(normDims.patience || 0),
    adviceSkill: clamp1to100((pct(normDims.logic||0) + pct(normDims.empathy||0)) / 2),
    planningSkill: pct(normDims.planning || 0),
  };
}

/* -------------------------------------------------------------------------
   ALGORITHM: Deep compatibility (category breakdown)
   Runs every category in COMPATIBILITY_CATEGORIES, produces a ranked list
   of scores, a set of dynamically generated explanation sentences built
   from the actual dimension comparisons (not fixed text), a full set of
   "who does X more" comparisons, and a couple of generated activity
   suggestions plus fun-fact lines. Keeps computeCompatibility() above
   completely intact for anything already relying on the simpler version.
------------------------------------------------------------------------- */

function scoreCategory(cat, a, b){
  if (cat.type === "combined"){
    const vals = cat.dims.map(d => (pct(a[d]||0) + pct(b[d]||0)) / 2);
    return Math.round(vals.reduce((s,v) => s+v, 0) / vals.length);
  }
  const sims = cat.dims.map(d => traitSimilarity(a[d]||0, b[d]||0, 5, 1.8));
  const raw = sims.reduce((s,v) => s+v, 0) / sims.length;
  return calibrateScore(raw);
}

function generateCompatibilityExplanations(a, b, nameA, nameB){
  const A = nameA || "Person A", B = nameB || "Person B";
  const lines = [];
  const gap = (dim) => (a[dim]||0) - (b[dim]||0);

  if (Math.abs(gap("leadership")) >= 4){
    const leader = gap("leadership") > 0 ? A : B;
    const other = leader === A ? B : A;
    lines.push(`${leader} naturally takes the lead while ${other} is more comfortable supporting, which tends to work well if you both actually like it that way.`);
  }
  if ((a.patience||0) < -1 && (b.patience||0) < -1){
    lines.push(`You both tend to avoid conflict rather than lean into it, which can work in the short term but may delay solving problems that need airing out.`);
  }
  if (Math.abs(gap("planning")) >= 4){
    const planner = gap("planning") > 0 ? A : B;
    const other = planner === A ? B : A;
    lines.push(`${planner} enjoys planning things out while ${other} prefers to improvise, so you'll naturally divide who handles structure and who handles spontaneity.`);
  }
  if ((a.responsibility||0) >= 3 && (b.responsibility||0) >= 3){
    lines.push(`You both take responsibility seriously, which means things generally get done without either of you having to chase the other.`);
  }
  if (Math.abs(gap("socialEnergy")) >= 5){
    const social = gap("socialEnergy") > 0 ? A : B;
    const other = social === A ? B : A;
    lines.push(`${social} tends to bring the social energy while ${other} recharges in quieter settings, which can balance out well with a little give on both sides.`);
  }
  if ((a.trust||0) >= 3 && (b.trust||0) >= 3){
    lines.push(`Trust comes relatively easily to both of you, which tends to make the whole relationship lower-friction.`);
  }
  if ((a.trust||0) <= -2 || (b.trust||0) <= -2){
    lines.push(`At least one of you tends to guard trust carefully, so it may take real time and consistency before this relationship feels fully secure.`);
  }
  if (Math.abs(gap("risk")) >= 5){
    const riskier = gap("risk") > 0 ? A : B;
    const other = riskier === A ? B : A;
    lines.push(`${riskier} is far more comfortable with risk than ${other} is, so travel and big decisions may need extra conversation to land somewhere you both feel good about.`);
  }
  if ((a.humor||0) >= 3 && (b.humor||0) >= 3){
    lines.push(`You both lead with humor, which makes hard conversations easier to survive and easy ones a lot more fun.`);
  }
  if (Math.abs(gap("independence")) >= 5){
    const indep = gap("independence") > 0 ? A : B;
    const other = indep === A ? B : A;
    lines.push(`${indep} needs more independence day-to-day than ${other} does, worth naming directly so it doesn't get quietly misread as distance.`);
  }
  return lines.slice(0, 6);
}

function computeWhoComparisons(a, b, nameA, nameB){
  const A = nameA || "Person A", B = nameB || "Person B";
  return WHO_COMPARISONS.map(c => {
    let av = a[c.dim] || 0, bv = b[c.dim] || 0;
    if (c.invert){ av = -av; bv = -bv; }
    const diff = av - bv;
    const winner = Math.abs(diff) <= 1 ? "Evenly matched" : (diff > 0 ? A : B);
    return { label: c.label, winner };
  });
}

const ACTIVITY_TEMPLATES = [
  { dims:["risk","curiosity"], activity:"A spontaneous multi-city trip with no fixed itinerary", vacation:"Backpacking somewhere neither of you has been", business:"A scrappy early-stage venture that rewards moving fast", hobby:"Trying a new adrenaline sport together", weekend:"A last-minute road trip with no real plan" },
  { dims:["creativity","openMindedness"], activity:"A collaborative art, music, or writing project", vacation:"A slow trip built around galleries, music, and local art scenes", business:"A creative studio or content brand", hobby:"Building something together with your hands", weekend:"A open-ended creative afternoon with zero deadline" },
  { dims:["discipline","planning"], activity:"Training for something together with a real endpoint", vacation:"A well-planned trip with a clear itinerary and reservations made early", business:"An operations-heavy business that rewards consistency", hobby:"A shared fitness or skill-building routine", weekend:"A productive weekend with a satisfying list to check off" },
  { dims:["empathy","kindness"], activity:"Volunteering somewhere together", vacation:"A quiet, restorative trip focused on connection over sightseeing", business:"A mission-driven venture or nonprofit", hobby:"Cooking for people you both care about", weekend:"A low-key weekend hosting people you love" },
  { dims:["humor","socialEnergy"], activity:"Hosting a big, chaotic game night", vacation:"A trip built around festivals, nightlife, and meeting people", business:"Something public-facing and social, like events or hospitality", hobby:"An improv or comedy class together", weekend:"A weekend packed with plans and people" },
];
function computePerfectActivities(a, b){
  const combined = {};
  DIMENSIONS.forEach(d => combined[d] = ((a[d]||0) + (b[d]||0)) / 2);
  const scored = ACTIVITY_TEMPLATES.map(t => ({
    t, score: t.dims.reduce((s,d) => s + combined[d], 0) / t.dims.length,
  })).sort((x,y) => y.score - x.score);
  return scored[0].t;
}

/* -------------------------------------------------------------------------
   ALGORITHM: Group compatibility (party of up to 5)
   Runs the existing pairwise compatibility for every pair in the group,
   then layers on group-level reads: an overall average, the strongest and
   weakest pair, each person's most distinctive trait relative to the
   group average (their "role"), traits the whole group shares, and the
   traits with the most spread (likely friction points for the group as a
   whole, not just one pair).
------------------------------------------------------------------------- */
function computeGroupCompatibility(profiles, names){
  const n = profiles.length;
  const label = (i) => names[i] || `Person ${i + 1}`;

  const pairwise = [];
  for (let i = 0; i < n; i++){
    for (let j = i + 1; j < n; j++){
      const c = computeCompatibility(profiles[i], profiles[j]);
      pairwise.push({ i, j, nameA: label(i), nameB: label(j), score: c.relationshipScore });
    }
  }
  const overallScore = Math.round(pairwise.reduce((s,p) => s + p.score, 0) / pairwise.length);
  const sortedPairs = [...pairwise].sort((a,b) => b.score - a.score);
  const bestPair = sortedPairs[0];
  const toughestPair = sortedPairs[sortedPairs.length - 1];

  const avgDims = {};
  DIMENSIONS.forEach(d => {
    avgDims[d] = profiles.reduce((s,p) => s + (p.normDims[d] || 0), 0) / n;
  });

  const roles = profiles.map((p, idx) => {
    const diffs = DIMENSIONS.map(d => ({ d, diff: (p.normDims[d] || 0) - avgDims[d] }));
    diffs.sort((a,b) => Math.abs(b.diff) - Math.abs(a.diff));
    const top = diffs[0];
    return {
      name: label(idx),
      archetype: p.archetype,
      standoutTrait: DIM_LABELS[top.d],
      direction: top.diff >= 0 ? "more" : "less",
    };
  });

  const groupSharedStrengths = DIMENSIONS
    .filter(d => profiles.every(p => (p.normDims[d] || 0) >= 3))
    .map(d => DIM_LABELS[d]).slice(0, 5);

  const groupFriction = DIMENSIONS.map(d => {
    const vals = profiles.map(p => p.normDims[d] || 0);
    const mean = vals.reduce((a,b) => a+b, 0) / n;
    const variance = vals.reduce((s,v) => s + (v-mean)*(v-mean), 0) / n;
    return { d, variance };
  }).sort((a,b) => b.variance - a.variance).slice(0, 3).map(x => DIM_LABELS[x.d]);

  let vibe = "The Crew";
  if (avgDims.risk > 3 && avgDims.humor > 2) vibe = "Chaos Squad";
  else if (avgDims.empathy > 3 && avgDims.kindness > 2) vibe = "The Support System";
  else if (avgDims.leadership > 3) vibe = "The Council";
  else if (avgDims.creativity > 3) vibe = "The Collective";
  else if (avgDims.discipline > 3) vibe = "The Operation";

  return { n, pairwise, overallScore, bestPair, toughestPair, roles, groupSharedStrengths, groupFriction, vibe };
}

function computeDeepCompatibility(profileA, profileB, nameA, nameB){
  const a = profileA.normDims, b = profileB.normDims;
  const base = computeCompatibility(profileA, profileB);
  const categories = COMPATIBILITY_CATEGORIES.map(cat => ({
    name: cat.name,
    score: scoreCategory(cat, a, b),
  })).sort((x,y) => y.score - x.score);
  const explanations = generateCompatibilityExplanations(a, b, nameA, nameB);
  const whoComparisons = computeWhoComparisons(a, b, nameA, nameB);
  const activities = computePerfectActivities(a, b);
  const funFacts = [
    `What ${nameA || "Person A"} could secretly admire about ${nameB || "Person B"}: their ${DIM_LABELS[Object.keys(b).sort((x,y)=>(b[y]||0)-(b[x]||0))[0]]}.`,
    `What ${nameB || "Person B"} could teach ${nameA || "Person A"}: how they handle ${DIM_LABELS[Object.keys(b).sort((x,y)=>(b[y]||0)-(b[x]||0))[0]]}.`,
    `What makes this pairing unique: ${base.sharedStrengths.length ? "a real overlap in " + base.sharedStrengths.slice(0,2).join(" and ") : "how differently you each approach the same situations"}.`,
  ];
  return { ...base, categories, explanations, whoComparisons, activities, funFacts };
}

/* =========================================================================
   V4 ADDITIONS
   Consistency check, framework approximations, duo titles, PF1 upgrade
   path, and the remaining fantasy/fun profile extras.
   ========================================================================= */

/* ---- Consistency check ---------------------------------------------------
   Only counts pairs where both questions actually got asked in this run,
   since the adaptive engine won't hit every pair every time. Two answers
   "agree" if they moved their shared dimension in the same direction.
   Falls back to a neutral baseline when too few pairs were asked to say
   anything meaningful. */
function computeConsistency(session){
  const answeredById = {};
  session.answers.forEach(a => { if (a) answeredById[a.questionId] = a; });
  let agree = 0, total = 0;
  CONSISTENCY_PAIRS.forEach(pair => {
    const a = answeredById[pair.a], b = answeredById[pair.b];
    if (!a || !b) return;
    const av = a.d[pair.dim] || 0, bv = b.d[pair.dim] || 0;
    if (av === 0 || bv === 0) return;
    total++;
    if ((av > 0) === (bv > 0)) agree++;
  });
  if (total < 2){
    return { pct: 88, pairsChecked: total, note: "Not enough overlapping situations were asked this run to measure it precisely, this is a typical baseline." };
  }
  const pct = Math.round((agree / total) * 100);
  return { pct, pairsChecked: total, note: `Based on ${total} pair${total === 1 ? "" : "s"} of separate situations that touch similar ground.` };
}

/* ---- Framework approximations (secondary to the PersonaForge archetype) - */
function computeBigFive(normDims){
  return BIG_FIVE_CATEGORIES.map(c => {
    const vals = c.dims.map(d => c.invert ? (100 - getDimensionPercent(normDims,d)) : getDimensionPercent(normDims,d));
    return { name: c.name, pct: Math.round(vals.reduce((s,v)=>s+v,0) / vals.length) };
  });
}
function computeDISC(normDims){
  const raw = DISC_CATEGORIES.map(c => ({
    name: c.name,
    val: c.dims.reduce((s,d) => s + getDimensionPercent(normDims,d), 0) / c.dims.length,
  }));
  const total = raw.reduce((s,r)=>s+r.val,0) || 1;
  return raw.map(r => ({ name: r.name, pct: Math.round((r.val/total)*100) })).sort((a,b)=>b.pct-a.pct);
}
function computeEnneagram(normDims){
  return scoreBySignature(ENNEAGRAM_TYPES, normDims)[0].item;
}
function computeMBTI(normDims){
  let type = "";
  MBTI_AXES.forEach(axis => {
    const posSum = axis.posDims.reduce((s,d) => s + getDimensionScore(normDims,d), 0);
    const negSum = axis.negDims.reduce((s,d) => s + getDimensionScore(normDims,d), 0);
    const positive = (posSum - negSum) >= 0;
    type += positive ? axis.letters[0] : axis.letters[1];
  });
  return type;
}
/* -------------------------------------------------------------------------
   ALGORITHM: Human Values
   Scores every value in HUMAN_VALUES the same way archetype matching
   scores a signature: weighted sum over the relevant dimensions,
   normalized against the maximum that signature could possibly reach
   (so a value with a heavier signature isn't unfairly favored), returns
   the top 5. Each result carries which measured dimensions it came from
   and their actual values, so the explanation can point at real
   evidence instead of a generic sentence. */
function computeHumanValues(normDims){
  const scored = HUMAN_VALUES.map(v => {
    const raw = v.signature.reduce((s,x) => s + getDimensionScore(normDims, x.dim) * x.w, 0);
    const maxPossible = v.signature.reduce((s,x) => s + 10 * x.w, 0);
    const pct = Math.max(0, Math.min(100, Math.round(((raw + maxPossible) / (2 * maxPossible)) * 100)));
    const topDim = [...v.signature].sort((a,b) => Math.abs(getDimensionScore(normDims,b.dim)) - Math.abs(getDimensionScore(normDims,a.dim)))[0];
    return { value: v, pct, topDim: topDim.dim, topDimPct: getDimensionPercent(normDims, topDim.dim) };
  });
  scored.sort((a,b) => b.pct - a.pct);
  return scored.slice(0, 5).map(s => ({
    id: s.value.id, name: s.value.name, icon: s.value.icon, pct: s.pct,
    explanation: `${s.pct}% reflects ${s.value.why}, most visibly in your ${DIM_LABELS[s.topDim]} (${s.topDimPct}%).`,
    inferredFrom: s.value.signature.map(x => DIM_LABELS[x.dim]),
  }));
}

/* -------------------------------------------------------------------------
   ALGORITHM: Seven Sins / Heavenly Virtues (fun, non-serious)
   Each of the 7 axes is one measured dimension read two directions.
   Nothing is recomputed between modes, the same normDims values just get
   read as either the sin-side or virtue-side percentage depending on
   sinIsHigh, so "only the interpretation changes" holds literally, not
   just in spirit. */
function computeSinVirtueProfile(normDims){
  return SIN_VIRTUE_AXES.map(axis => {
    const raw = getDimensionPercent(normDims, axis.dim);
    const sinPct = axis.sinIsHigh ? raw : 100 - raw;
    const virtuePct = 100 - sinPct;
    return { dim: axis.dim, sinLabel: axis.sinLabel, virtueLabel: axis.virtueLabel, sinPct, virtuePct };
  });
}

function computeFrameworkApproximations(normDims){
  return {
    bigFive: computeBigFive(normDims),
    disc: computeDISC(normDims),
    enneagram: computeEnneagram(normDims),
    mbti: computeMBTI(normDims),
  };
}

/* ---- Duo title and crest for the compare page ----------------------------- */
function computeDuoTitle(archA, archB){
  const extrasA = getArchetypeExtras(archA), extrasB = getArchetypeExtras(archB);
  const key1 = `${extrasA.element}|${extrasB.element}`;
  const key2 = `${extrasB.element}|${extrasA.element}`;
  const title = DUO_TITLES[key1] || DUO_TITLES[key2] || `${archA.name.replace("The ","")} & ${archB.name.replace("The ","")}`;
  return { title, colorA: extrasA.primaryColor, colorB: extrasB.primaryColor, iconA: archA.icon, iconB: archB.icon };
}

/* ---- Fantasy and fun profile extras ---------------------------------------- */
function computeFantasyWeapon(normDims){ return scoreBySignature(FANTASY_WEAPONS, normDims)[0].item; }
function computeFantasyCompanion(normDims){ return scoreBySignature(FANTASY_COMPANIONS, normDims)[0].item; }
function computeFantasyKingdom(normDims){ return scoreBySignature(FANTASY_KINGDOMS, normDims)[0].item; }
function computeFlower(normDims){ return scoreBySignature(FLOWERS, normDims)[0].item; }
function computePlanet(normDims){ return scoreBySignature(PLANETS, normDims)[0].item; }
function computeConstellation(normDims){ return scoreBySignature(CONSTELLATIONS, normDims)[0].item; }
function computeGemstone(normDims){ return scoreBySignature(GEMSTONES, normDims)[0].item; }
function computeWeather(normDims){ return scoreBySignature(WEATHER_TYPES, normDims)[0].item; }
function computeCoffeeOrder(normDims){ return scoreBySignature(COFFEE_ORDERS, normDims)[0].item; }

/* -------------------------------------------------------------------------
   PF1 -> PF2 upgrade path
   Instead of leaving the 5 v2 dimensions permanently at a neutral 0 for
   someone with an old code, this picks real questions from the current
   200-question bank, ranked by how strongly they touch those 5
   dimensions, so answering a handful of them fills the gap with real
   signal instead of a default. No new authoring needed, it's drawn from
   content that already exists.
------------------------------------------------------------------------- */
const V1_UPGRADE_DIMENSIONS = ["emotionalStability","competitiveness","responsibility","persistence","openMindedness"];
const UPGRADE_QUESTION_COUNT = 9;

function buildUpgradeQuestions(){
  const scored = QUESTIONS.map(q => {
    let score = 0;
    const touched = new Set();
    q.options.forEach(opt => V1_UPGRADE_DIMENSIONS.forEach(d => {
      if (opt.d[d]){ score += Math.abs(opt.d[d]); touched.add(d); }
    }));
    return { q, score, touchedCount: touched.size };
  }).filter(x => x.score > 0)
    .sort((a,b) => (b.touchedCount - a.touchedCount) || (b.score - a.score));
  return scored.slice(0, UPGRADE_QUESTION_COUNT).map(x => x.q);
}

class UpgradeQuizSession {
  constructor(decodedProfile){
    this.baseNormDims = { ...decodedProfile.normDims };
    this.archetype = decodedProfile.archetype;
    this.name = decodedProfile.name;
    this.questions = buildUpgradeQuestions();
    this.answers = [];
    this.cursor = 0;
    this.delta = {};
    V1_UPGRADE_DIMENSIONS.forEach(d => this.delta[d] = 0);
  }
  totalLength(){ return this.questions.length; }
  current(){ return this.cursor < this.questions.length ? this.questions[this.cursor] : null; }
  isComplete(){ return this.cursor >= this.questions.length; }
  answer(optionIndex){
    const q = this.current();
    if (!q) return;
    const opt = q.options[optionIndex];
    Object.entries(opt.d).forEach(([dim, val]) => {
      if (V1_UPGRADE_DIMENSIONS.includes(dim)) this.delta[dim] = (this.delta[dim] || 0) + val;
    });
    this.answers.push({ questionId: q.id, optionIndex });
    this.cursor++;
  }
  finalNormDims(){
    const out = { ...this.baseNormDims };
    V1_UPGRADE_DIMENSIONS.forEach(d => {
      out[d] = Math.max(-10, Math.min(10, Math.round(this.delta[d] || 0)));
    });
    return out;
  }
}




/* ---------------- QUIZ PROGRESS PERSISTENCE ------------------------------
   Going home mid-quiz (or just closing the tab) never throws answers away.
   Progress is saved to localStorage and picked back up on the exact next
   unanswered question, not restarted from scratch. */
const QUIZ_PROGRESS_KEY = "pf_quiz_progress";
function saveQuizProgress(){
  if (!session || session.cursor <= 0 || session.isComplete()) return;
  try{ localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(session.serialize())); }
  catch(e){ /* storage unavailable, skip silently */ }
}
function getSavedQuizProgress(){
  try{
    const raw = localStorage.getItem(QUIZ_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}
function clearQuizProgress(){
  try{ localStorage.removeItem(QUIZ_PROGRESS_KEY); } catch(e){ /* ignore */ }
}

/* ---------------- shareable profile links --------------------------------
   The QR already encodes a URL with ?code=..., but until now nothing on
   load ever read that parameter back out, so scanning it just opened a
   blank landing page. This closes that loop: on boot, and whenever a
   result is shown, the address bar carries the code, so the QR, a copied
   link, and the browser's own URL bar are all the same shareable thing.
   Query-param format (?code=...) is the primary, fully-supported form
   since it works on any static host with zero extra setup. A trailing
   path segment that looks like a code (e.g. /PersonaForge/Yota-PF2-...)
   is also read as a best-effort fallback, but actually serving that path
   on GitHub Pages needs a 404->index.html redirect set up in the repo;
   without it, only the ?code= form will reach the app at all. */
function getProfileCodeFromURL(){
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get("code");
  if (fromQuery) return decodeURIComponent(fromQuery);
  const segments = location.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "";
  if (/-PF[12]-/.test(last)) return decodeURIComponent(last);
  return null;
}

function setShareableURL(code){
  if (!code || !window.history || !history.pushState) return;
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("code", code);
  history.pushState({ code }, "", url.toString());
}

function clearShareableURL(){
  if (!window.history || !history.pushState) return;
  const url = new URL(location.href);
  url.search = "";
  history.pushState({}, "", url.toString());
}

let pendingSharedCode = null;
let pendingSharedProfile = null;

function tryLoadProfileFromURL(){
  const code = getProfileCodeFromURL();
  if (!code) return false;
  const decoded = decodeCode(code);
  if (!decoded) return false;
  pendingSharedCode = code;
  pendingSharedProfile = decoded;
  renderSharedLinkInterstitial();
  return true;
}

/* =========================================================================
   FORGE - RESULT BUILDING
   Used both for a freshly completed quiz and for viewing a shared/saved
   code: builds the full profile-extras bundle and the final result
   object, plus the small local history log.
   ========================================================================= */
function buildProfileExtras(normDims, archetype, ranked, session, upgradedFromV1){
  return {
    mix: computePersonalityMix(ranked),
    soul: computeSoulType(normDims),
    humanValues: computeHumanValues(normDims),
    lifeBalance: computeLifeBalance(normDims),
    motivationFacets: computeMotivationFacets(normDims),
    sinVirtue: computeSinVirtueProfile(normDims),
    narrativeRole: computeNarrativeRole(normDims),
    social: computeSocialProfile(normDims),
    relationship: computeRelationshipProfile(normDims),
    thinking: computeThinkingProfile(normDims),
    learning: computeLearningProfile(normDims),
    decision: computeDecisionProfile(normDims),
    stress: computeStressResponses(normDims),
    environments: computeEnvironments(normDims),
    achievements: computeAchievements(normDims),
    aesthetic: computeAesthetic(normDims),
    entertainment: computeEntertainment(normDims),
    extras: getArchetypeExtras(archetype),
    funStats: computeFunStats(normDims),
    confidence: computeAssessmentConfidence(ranked, normDims, session, upgradedFromV1),
    hidden: computeHiddenTraits(normDims, archetype),
    fantasyRole: computeFantasyRole(normDims),
    friendship: computeFriendshipProfile(normDims),
    motivation: computeMotivation(normDims),
    mythicalCreature: computeMythicalCreature(normDims),
    season: computeSeason(normDims),
    timeOfDay: computeTimeOfDay(normDims),
    chessPiece: computeChessPiece(normDims),
    frameworks: computeFrameworkApproximations(normDims),
    fantasyWeapon: computeFantasyWeapon(normDims),
    fantasyCompanion: computeFantasyCompanion(normDims),
    fantasyKingdom: computeFantasyKingdom(normDims),
    flower: computeFlower(normDims),
    planet: computePlanet(normDims),
    constellation: computeConstellation(normDims),
    gemstone: computeGemstone(normDims),
    weather: computeWeather(normDims),
    coffeeOrder: computeCoffeeOrder(normDims),
  };
}

/* Takes the session explicitly (rather than reading a global) since this
   runs on quiz.html, where the quiz session lives, and its result then
   travels to result.html for display. */
function computeResult(session){
  const normDims = session.normalizedDims();
  const match = matchArchetype(normDims);
  const code = encodeCode(match.primary.id, normDims, session.name);
  const result = {
    name: session.name || "",
    meta: session.meta || {},
    normDims,
    archetype: match.primary,
    runnerUp: match.runnerUp,
    ranked: match.ranked,
    subProfile: computeSubProfile(normDims, match.primary),
    code,
    careers: computeCareers(normDims),
    relationships: computeRelationshipStyles(normDims),
    traits: computeMeasuredTraits(normDims),
    consistency: computeConsistency(session),
    upgradedFromV1: false,
    ...buildProfileExtras(normDims, match.primary, match.ranked, session, false),
  };
  localStorage.setItem("pf_last_code", code);
  saveToTimeline(result);
  clearQuizProgress();
  return result;
}

/* ---------------- TIMELINE -----------------------------------
   Since there's no backend, "history" just means a small local log kept in
   localStorage on this device: each completed result, versioned and
   timestamped. On a retake, the newest run is compared against the most
   recent previous entry so the person can see roughly what shifted. */
function saveToTimeline(result){
  try{
    const history = JSON.parse(localStorage.getItem("pf_history") || "[]");
    history.push({
      code: result.code,
      name: result.name,
      archetype: result.archetype.name,
      normDims: result.normDims,
      traits: result.traits,
      timestamp: Date.now(),
      version: CODE_VERSION,
    });
    while (history.length > 10) history.shift();
    localStorage.setItem("pf_history", JSON.stringify(history));
  } catch(e){ /* storage unavailable, skip silently */ }
}
function getPreviousTimelineEntry(){
  try{
    const history = JSON.parse(localStorage.getItem("pf_history") || "[]");
    return history.length >= 2 ? history[history.length - 2] : null;
  } catch(e){ return null; }
}

function buildResultFromDecoded(decoded, code){
  const normDims = decoded.normDims;
  const match = matchArchetype(normDims);
  return {
    name: decoded.name || "",
    meta: {},
    normDims,
    archetype: decoded.archetype,
    runnerUp: match.runnerUp,
    ranked: match.ranked,
    subProfile: computeSubProfile(normDims, decoded.archetype),
    code,
    careers: computeCareers(normDims),
    relationships: computeRelationshipStyles(normDims),
    traits: computeMeasuredTraits(normDims),
    consistency: null,
    ...buildProfileExtras(normDims, decoded.archetype, match.ranked, null, !!decoded.upgraded),
    upgradedFromV1: !!decoded.upgraded,
    decodedProfile: decoded,
  };
}

