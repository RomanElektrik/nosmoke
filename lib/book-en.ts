// Английский текст книги «Выдох» — отдельным файлом: 114 КБ русского и столько
// же английского в одном модуле читать невозможно. Вливается в CHAPTERS при
// загрузке lib/book.ts; ридер уже умеет фолбэк (chapterBody: ru ? bodyRu : bodyEn ?? bodyRu).
// Не переводы-кальки: адаптация под носителя, структура блоков совпадает с RU 1:1.
import type { BookBlock } from './book';

export type BookEn = { titleEn: string; leadEn: string; bodyEn: BookBlock[]; takeawayEn: string };

export const BOOK_EN: Record<string, BookEn> = {
  "intro": {
    "titleEn": "Before we start",
    "leadEn": "This isn't a treatment plan or a list of bans — it's a straight conversation about what a cigarette really does in your life.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Let's agree on one thing up front: nobody here is going to shake their head at you and point to a poster of blackened lungs. You've seen all that already. If scare tactics worked, you'd be finishing this book as a non-smoker."
      },
      {
        "type": "p",
        "text": "This is just an honest conversation. The kind you have at the kitchen table late at night, when you don't have to pretend everything's under control."
      },
      {
        "type": "h",
        "text": "One detail changes everything"
      },
      {
        "type": "p",
        "text": "Imagine you've carried a pebble in your pocket for years, sure that it brings you luck. Then someone shows you: it's an ordinary pebble, and the luck was happening on its own. Throwing it away becomes easy — not because you worked up the nerve, but because you stopped believing in it."
      },
      {
        "type": "p",
        "text": "Craving works the same way. Once you see how it's actually built and what it really promises, a lot of it stops tugging at your sleeve. That's the next chapter — and yes, willpower turns out not to be the lead role."
      },
      {
        "type": "h",
        "text": "How to read this"
      },
      {
        "type": "p",
        "text": "One chapter at a time. Don't binge it. Read a chapter, then hold it up against yesterday: where was the cigarette, what were you feeling right then, what did it supposedly give you. This book works when you check it against your own ashtray, not against a theory."
      },
      {
        "type": "p",
        "text": "The first days are the hardest. After that, craving comes in waves — shorter, rarer, weaker. This isn't weeks of solid torment, it's a process that fades. And if you slip, that's not a failure and not back to zero. It's more like a clue: you found out which moment catches you. And one cigarette won't reset your counter in Breez — it counts the journey, not a spotless record."
      },
      {
        "type": "h",
        "text": "The book and the app"
      },
      {
        "type": "p",
        "text": "This book and Breez are about the same thing from two sides: here it gets explained, there you get walked through it day by day. Keep them together — it makes more sense that way."
      },
      {
        "type": "p",
        "text": "And straight about the limits: this is educational text and support, not medical advice, and it doesn't replace a real doctor. If you decide to add a patch, gum, or tablets — that's not a white flag or a crutch for the weak, just one more tool that works alongside understanding, not instead of you. And anything prescription — calmly, and only through a doctor, no improvising."
      },
      {
        "type": "p",
        "text": "Ahead: why you don't have to hang on by your teeth, how craving lies to you, and what to do instead of fighting. Turn the page."
      }
    ],
    "takeawayEn": "It isn't the cigarette that holds you — it's your belief in it. This book is about letting that belief go."
  },
  "willpower": {
    "titleEn": "Willpower isn't the point",
    "leadEn": "You're not weak. You were just taught to solve the problem with the wrong tool.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Someone has surely told you at least once: \"You'll quit when you really want to. It's a matter of character.\" And maybe you nod, but something tightens inside. Because you do have character. You carry your work, you keep your word, you get up to an alarm in the winter dark. But with cigarettes — somehow it misfires again and again. And the conclusion suggests itself: something must be wrong with me."
      },
      {
        "type": "p",
        "text": "So here it is. Nothing is wrong with you. You were just handed the wrong problem and the wrong tool for it."
      },
      {
        "type": "h",
        "text": "\"Strong people quit\" — and why that's a lie"
      },
      {
        "type": "p",
        "text": "There's a convenient myth: the weak smoke, the strong-willed quit. It sounds logical, which is exactly what makes it so harmful. It implies that if you haven't quit, you're on the weak team. And you quietly believe it, and that makes it heavier still: why try, if you're \"not made of the right stuff\"?"
      },
      {
        "type": "p",
        "text": "Look around. Surgeons smoke — the ones who stand over a table for eight hours. Mothers of three smoke, the ones who haven't slept properly in five years. People smoke who lift weights in the gym you couldn't budge. Are they weak-willed? They'd outlast half the non-smokers you know. Smoking doesn't screen for strength. It catches everyone, because what holds you isn't character — it's chemistry and habit dressed up as \"I need this.\""
      },
      {
        "type": "p",
        "text": "And the other way round: people who quit easily usually tell it without any heroics. Not \"I gritted my teeth,\" but \"at some point I just stopped needing it.\" Notice the difference. Not endured. Stopped needing."
      },
      {
        "type": "h",
        "text": "Take a look at what willpower actually is"
      },
      {
        "type": "p",
        "text": "Willpower is when you want something and forbid yourself to have it. You want to sleep in — you get up. You want cake — you push the plate away. You want a cigarette — you hold out. Which means willpower always works on top of the wanting. The wanting hasn't gone anywhere; you're just pressing it down with your palm."
      },
      {
        "type": "p",
        "text": "Try holding that. A minute is easy. An hour is already work. A week? A month? A year? It's like holding a door while someone shoves at it from the other side. At first you're fresh, foot braced. Then you get tired. Then you get tired of being tired. And on some ordinary Tuesday, when work is on fire and you don't even have the energy for dinner, your hand reaches out on its own — and the door swings open. Not because you're weak. Because holding a door forever is physically impossible."
      },
      {
        "type": "p",
        "text": "That's why \"quitting on willpower\" so often ends in a slip. Not because you ran out of willpower. Because willpower is the wrong tool for this job. There's nothing here for it to hold on to for long."
      },
      {
        "type": "h",
        "text": "While the cigarette still seems to give you something, you're in deprivation mode"
      },
      {
        "type": "p",
        "text": "Here's the crucial part. If deep down you believe the cigarette calms you, helps you focus, makes a break nicer — then quitting means taking something away from yourself. Something good. And the whole thing turns into one long mourning. You sit there missing a friend you \"had to send away.\" Of course you're pulled back."
      },
      {
        "type": "p",
        "text": "But look at it soberly. A cigarette doesn't really calm you — between drags the nicotine drains away, a low unease rises, and the next cigarette simply brings it back to zero. And you take that brief \"ah, better\" for a gift. It's like scratching a mosquito bite: relief for a second, then it itches harder, so you scratch again. The relief is real. It's just that the itch was arranged by the same hand that now \"treats\" it. Stop scratching altogether and in a couple of days you'll forget the bite was ever there."
      },
      {
        "type": "p",
        "text": "Until you see this, every method is a fight. Once you see it, there's nothing left to fight."
      },
      {
        "type": "h",
        "text": "So what's this book for"
      },
      {
        "type": "p",
        "text": "The point of \"Exhale\" isn't to issue you a bigger ration of patience so you can hold that door longer. The point is to go through it with you, calmly and without lecturing: what the cigarette actually gives, and what it only promises. So the wanting leaves on its own rather than under duress — because the reason for it is gone."
      },
      {
        "type": "p",
        "text": "When you stop seeing anything valuable in a cigarette, walking past one usually gets easy — no heroics required. Roughly the way you walk past things you simply don't need. That isn't force applied to yourself. That's freedom."
      },
      {
        "type": "p",
        "text": "Yes, the first days without smoking can be uncomfortable — the body is readjusting, waves of wanting roll in. But they're shorter and milder than you fear, and there's a whole chapter on withdrawal later. And to be clear: willpower isn't cancelled here. It just stops being the only thing holding everything up. When you understand the cigarette isn't your friend, you don't need to hold the door — there's no reason to."
      },
      {
        "type": "p",
        "text": "There's pharmacy help too — nicotine patches, gum, prescription medicines (prescription only with a doctor). They're not a white flag or a crutch for the weak, but a way to take the edge off the first waves while the understanding settles in. And if you ever slip — that's not a collapse and not a verdict on you. It's just a mark on the map: right here, in this spot, the ground was slippery. We'll work through that calmly later on. This is educational text, not medical advice."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Think of the last cigarette you smoked. Where were you, what were you feeling a minute before it? Now honestly, one word to yourself: what did it actually change five minutes later? Don't rush the answer — just look. That's the first brick we pull out of the wall."
      }
    ],
    "takeawayEn": "Willpower is holding a door someone's shoving at. Freedom is when there's no one on the other side."
  },
  "trap": {
    "titleEn": "Where craving comes from",
    "leadEn": "A cigarette doesn't remove discomfort — it supplies it, then charges you for the pause.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Last chapter we agreed: willpower isn't the main character here. But if it isn't strength of character — then what is it? Why do millions of calm, grown, intelligent people reach for the pack again and again, while telling themselves off for it? The answer is simpler and less pleasant than it seems. It's in how the mechanism itself is built."
      },
      {
        "type": "h",
        "text": "Where the \"I need one\" comes from"
      },
      {
        "type": "p",
        "text": "Picture an ordinary day. You finished a cigarette, put it out, got on with things. An hour goes by, maybe ninety minutes — and somewhere in the background a mild unease switches on. Not pain, not panic. More like a small itch you can't scratch. A little hollow inside, hands with nothing to do, your thoughts drifting toward the door or the smoking spot. You probably explain it your own way: tired, stressful day, the boss again, the weather."
      },
      {
        "type": "p",
        "text": "The truth is that a lot of it isn't about the boss. Real stress is real, of course, and it layers on top. But there's a lower layer you usually don't notice: the nicotine in your blood is draining, your body is used to it and now feels the lack. That's not \"nerves\" and not weak will — it's ordinary readjustment happening between drags, quietly, in the background. That discomfort you're used to muffling is, in large part, manufactured by the previous cigarette. Not only by work. Not only by life. Also by the cigarette you smoked an hour ago."
      },
      {
        "type": "h",
        "text": "Relief out of nothing"
      },
      {
        "type": "p",
        "text": "So you light up. And it really does get better — that's not made up, the feeling is real. But look closely at what actually happened. Nothing good was added to you. Something bad was taken away — the bad that the previous cigarette planted a few minutes ago. You returned to zero. To the point where nothing itches and nothing gnaws. And your brain files that return to zero as a high, a reward, an \"ah, that's better.\""
      },
      {
        "type": "p",
        "text": "And now the awkward part. A person who doesn't smoke lives at that zero all the time. For free. No ritual, no hunting for a lighter, no stepping out into the cold. They don't have this little pit to fill every hour — because there's no one digging it. The calm you chase with a pack is simply their background state. A smoker pays with money, time and health for occasional access to what a non-smoker has always, for nothing."
      },
      {
        "type": "p",
        "text": "Here's an image that helps you see it. A cigarette is like the neighbour upstairs who drills the wall all night and sells you earplugs in the morning. The earplugs work, the noise stops, you're grateful. And you don't notice that the drill and the earplugs come from the same hands. Get rid of the neighbour and there's no one left to drill. The quiet arrives on its own, and you never pay for it again."
      },
      {
        "type": "h",
        "text": "Why people do get out of this"
      },
      {
        "type": "p",
        "text": "If the discomfort between cigarettes is created by the habit itself, then the way out makes sense. When you quit, the pit will still be felt for a while — it was dug over years, it won't fill in overnight. The first days are usually the loudest: craving rolls in, lets go, rolls in again. But it isn't a solid wall you have to push through with willpower. It's waves. And each day they get shorter, rarer and weaker — not on a timer, everyone has their own rhythm, but the direction is always the same. The body stops waiting for a dose and relearns how to live at zero, the way it once knew how."
      },
      {
        "type": "p",
        "text": "You don't have to face those first waves bare-handed. A nicotine patch or gum, and — if a doctor decides so — tablets, are not a white flag or an admission that you're weaker than others. It's like holding the rail while the carriage rocks: it gets you through the lurching without heroics. That kind of support works best not instead of seeing the trap but together with it — when you know exactly what you're smoothing out and why."
      },
      {
        "type": "p",
        "text": "And if you do slip and light one — that's not a collapse and not a reason to write the whole thing off. Treat it as a note in the margin: here's the trigger, here's the moment where the pit called again. One drag doesn't erase a week without cigarettes. The counter in this app remembers that for you — it doesn't reset over a single miss."
      },
      {
        "type": "p",
        "text": "Next we'll unpack another swap — that famous \"pleasure\" of a cigarette which, if you look honestly, was never there at all."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Next time the urge comes, don't reach for the pack straight away. Give it a minute and quietly watch the sensation: where exactly in your body is this \"hunger,\" what is it really — sharp, or more of a murky background hum? Just look at it from the outside, like at a stranger with a drill. The minute will pass — and with it you'll see that it isn't you being weak, it's just a wave, and it's already receding."
      },
      {
        "type": "p",
        "text": "This is educational text and support, not medical advice. Patches, gum, and especially prescription tablets are worth discussing with a doctor."
      }
    ],
    "takeawayEn": "Craving isn't a hole in you. It's a hole the last cigarette dug, to sell you the next one."
  },
  "pleasure": {
    "titleEn": "The pleasure that was never there",
    "leadEn": "The hit from a cigarette isn't taste or enjoyment — it's a learned reaction to something finally letting go.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Last chapter we took apart the trap itself: craving doesn't just appear, it has a spring behind it, and that spring is nicotine — which creates the discomfort so it can relieve it later. Now let's look at the thing that usually feels untouchable. Pleasure. That \"but I actually like it,\" the thing every smoker leans on when they want to keep a loophole open."
      },
      {
        "type": "p",
        "text": "Because if you look honestly at that \"like,\" there isn't much of it left."
      },
      {
        "type": "h",
        "text": "The brain is a poor witness"
      },
      {
        "type": "p",
        "text": "Picture this: you've been stuck in traffic all day, your back has seized up, and you finally arrive, get out and straighten up. That moment when something cracks and releases — it feels good. But you don't conclude that you've learned to love straightening your back as a pleasure in its own right. It was bad before, then it was normal, and your brain tagged the contrast as \"good.\""
      },
      {
        "type": "p",
        "text": "With a cigarette it's exactly the same, only you don't see it. The nicotine drains away — mild irritation rises, scattered attention, a hollow under the ribs. You inhale — and it goes out. Your brain catches the swing from \"uneasy\" to \"level\" and stamps it: pleasure. Even though all you did was return to the point where anyone who doesn't smoke at all already stands. Zero. And you pay for that zero every hour or so, over and over."
      },
      {
        "type": "p",
        "text": "The brain is a great watchdog and a useless witness. It doesn't distinguish \"I feel good\" from \"I stopped feeling bad.\" To it, that's the same flash. And the cigarette's entire reputation as a source of pleasure rests on exactly that confusion."
      },
      {
        "type": "h",
        "text": "You had to learn this"
      },
      {
        "type": "p",
        "text": "Remember your very first cigarette. Honestly, without the romance. Your throat burned, your head swam, some people are sick, and the first thought was \"wait, people actually like this?\" No enjoyment at all. Your body met the smoke as exactly what it is — irritating fumes to be got rid of."
      },
      {
        "type": "p",
        "text": "And here's what matters: the taste for cigarettes didn't arrive on its own. You built it. Drag by drag you trained yourself to tolerate something that was frankly repulsive at first — until the unpleasant became familiar, and the familiar got filed by your brain as \"pleasant.\" Real pleasure doesn't work that way. You don't need training to love warm bread, cold water on a hot day, or the smell after rain. You like them instantly. Here you had to push through disgust to reach the \"high.\" That doesn't look like enjoyment. It looks like conditioning."
      },
      {
        "type": "p",
        "text": "Something you had to train yourself into through \"ugh\" is worth one question: who trained whom here?"
      },
      {
        "type": "h",
        "text": "A conditioned reflex, not love"
      },
      {
        "type": "p",
        "text": "Remember the dog that drooled at the sound of a bell? Because the bell kept coinciding with food. The bell itself is not the least bit tasty. The brain just linked the two so firmly that the body reacts to an empty signal."
      },
      {
        "type": "p",
        "text": "Same with you, only there's a whole bundle of signals. The cigarette got glued to morning coffee, to stepping outside, to the pause after a hard conversation, to standing around with friends. And when any of those moments arrives, you feel \"I want a smoke.\" But it isn't smoke you want. You want the pause. The quiet. Permission to do nothing for five minutes. An excuse to leave the overheated room. The cigarette just happened to be standing there at the right moment and quietly took credit for all of it — as if it were the one handing you the coffee, the fresh air and the quiet, though they were here before it."
      },
      {
        "type": "p",
        "text": "That's good news, by the way. The coffee, the fresh air, the pause, the friends — all of it stays with you. The only thing that disappears is one extra line on the bill you'd been paying for nothing."
      },
      {
        "type": "h",
        "text": "A simple test"
      },
      {
        "type": "p",
        "text": "Next time you light up, don't hurry. Catch the exact moment you'd call pleasant, and ask yourself one quiet question: what feels good right now — the smoke in my mouth, or the fact that the tension from a minute ago just let go?"
      },
      {
        "type": "p",
        "text": "Listen honestly. Hot smoke in itself — does it taste good? Or is the good thing something else entirely: that the itch inside went quiet, that your hands are busy, that you gave yourself permission to exhale and be nobody's for a while? Almost always, if you look closely, it turns out you weren't enjoying the cigarette. You were enjoying the break. And you can take the break without it."
      },
      {
        "type": "p",
        "text": "And once you truly see that — from the inside, not just as words — quitting stops feeling like giving up a pleasure. Because there's nothing to give up: the pleasure you supposedly lose was never there. That sense of loss — of something being taken from you — is the next chapter. It'll turn out to be cleverer than it looks, too."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Now not a question but a small action. Take your next break without a cigarette. When the urge to step out and light up comes, step out anyway. Go to the window, out to the yard, out into the air. Same five minutes, same quiet, same excuse to be nobody's. Just no smoke. And notice that almost everything you went out for is still there. Thirty seconds of quiet and one quiet observation — no one to report to."
      }
    ],
    "takeawayEn": "You're not giving up a pleasure. You're firing the middleman who kept selling you your own break."
  },
  "why-loss": {
    "titleEn": "Why quitting feels like loss",
    "leadEn": "What scares you isn't nicotine — it's that your brain counts the cigarette as part of you. Let's work out whose part it really is.",
    "bodyEn": [
      {
        "type": "p",
        "text": "We've already established that the pleasure you supposedly smoke for was never there — it was just a pause in discomfort that nicotine itself arranged. But even when you get that with your head, something heavy still sits inside. A kind of pre-packed grief. As if what's ahead isn't freedom but a funeral."
      },
      {
        "type": "p",
        "text": "That's the strangest thing about quitting. Logically you lose nothing — you lose the morning cough, the smell in your jacket, the money, the breathlessness on the third flight of stairs. And yet it feels like a friend is being taken from you. Let's honestly work out where that feeling comes from and whose it is."
      },
      {
        "type": "h",
        "text": "Your brain tied the cigarette to a hundred small things"
      },
      {
        "type": "p",
        "text": "Over the years you didn't smoke \"a pack a day.\" You smoked specific moments. The first drag with coffee while the kettle is still going. The break after closing a hard task. The cigarette when you stepped out of a noisy room and it finally went quiet. A drag in the car at a red light. After eating. After a fight. After sex. Before an important call, to pull yourself together."
      },
      {
        "type": "p",
        "text": "The brain is a link-finding machine. It doesn't sort habits into useful and useless; it just notices: this action keeps repeating next to this moment — so I'll glue them together. And it did. Hundreds of times. That's why coffee without a cigarette now feels unfinished, and a pause without a drag feels empty. It isn't the cigarette being magic. It's you, with your own hands, tying it to the best and most important points of your day."
      },
      {
        "type": "p",
        "text": "The good news hides in exactly the same place. If the brain made the links, the brain can unmake them. Coffee stays coffee. The quiet after a noisy day stays quiet. The moment after a meal isn't going anywhere. The cigarette was never the owner of those minutes, just a bystander who stood close and acted indispensable."
      },
      {
        "type": "h",
        "text": "Not a friend. A minder"
      },
      {
        "type": "p",
        "text": "A friend is someone who's there when you're happy and asks nothing in return. Test the cigarette against that. Is it there when you feel good? Or does it turn up when you start feeling bad — and you feel bad precisely because it's been a while? A friend doesn't wake you at night demanding you step outside. A friend doesn't ruin a holiday flight. A friend doesn't make you stand in the rain outside a café while everyone else sits in the warm."
      },
      {
        "type": "p",
        "text": "What you take for friendship is a hostage's attachment to their captor. It seems like the cigarette bails you out, because it relieves the tension it created itself. It's as if a colleague punctured your tyre every morning and then drove you to work — and you sincerely considered him your saviour. Parting with someone like that isn't a loss. It's the end of a shift you never signed up for."
      },
      {
        "type": "h",
        "text": "Fear isn't speaking in your voice"
      },
      {
        "type": "p",
        "text": "When you picture life without cigarettes and everything inside tightens — listen to whose voice that is. \"What if I can't do it,\" \"but what about coffee,\" \"what if I turn boring and irritable,\" \"later, not now, this isn't the right moment.\" It's very convincing. But it isn't your opinion of yourself. It's the dependence protecting its food supply, and it says precisely what will make you leave everything as it is."
      },
      {
        "type": "p",
        "text": "The difference is simple. You want to breathe fully, not count cigarettes in the pack, not plan the day around smoke breaks. The voice of fear wants one thing — for you to light up again. Once you can tell them apart, half the power of that fear is gone. Not because it lies badly, but because you can finally see who's talking."
      },
      {
        "type": "p",
        "text": "And yes — the first days really are denser. Craving doesn't come as an even hum but in rushes: it rises, stands there a while and drains away, like water round your feet at the shore. The further you go, the rarer and quieter those rushes get. If at some point it hits especially hard, that's not weak character and not a reason to grit your teeth alone. Sometimes it's easier to get through with support — for some people a short conversation, for some a walk, for some pharmacy aids. Which of those aids might suit you, if any, is a conversation with a doctor, not with a book or an app. The point is the same: support isn't there instead of you, it's there beside you while you do your part."
      },
      {
        "type": "h",
        "text": "Not \"quitting\" — \"getting rid of\""
      },
      {
        "type": "p",
        "text": "Words do more than they seem to. \"Quitting\" is about deprivation. As if something's being taken from you and you stand there heroically enduring it. With that framing every day is a fight, and sooner or later you get tired of fighting. \"Getting rid of\" is a different story entirely. What do people get rid of? Things that were in the way, weighing on them, wearing them out. Dead weight in the backpack on a long climb."
      },
      {
        "type": "p",
        "text": "Try living that difference as a fact, not a nice phrase. You aren't losing a cigarette — you're getting back your coffee, your quiet, your pause, a morning without coughing and an evening without a run to the shop for a pack. All of it was yours from the start. Nobody is taking anything from you — on the contrary, someone who sat between you and your own life for years is finally being shown out."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Take one familiar \"cigarette\" scene — morning coffee, say, or stepping outside after work. Out loud or to yourself, say: \"This is mine. This stays with me without the cigarette.\" One scene, one sentence, thirty seconds. You aren't taking the moment away from yourself — you're taking it back, whole."
      },
      {
        "type": "p",
        "text": "This is educational text and support in quitting, not medical advice. Any pharmacy aids and how to use them — only after talking to a doctor."
      }
    ],
    "takeawayEn": "You're not saying goodbye to a friend — you're showing out an uninvited lodger who spent years passing your own life off as his hospitality."
  },
  "stress": {
    "titleEn": "“It takes the edge off” — the most expensive lie",
    "leadEn": "A cigarette doesn't switch off stress — it creates it, then charges you for a short breather.",
    "bodyEn": [
      {
        "type": "p",
        "text": "In the last chapter we talked about how quitting feels like a loss — like something is being taken from you. Now let's look at what exactly you think you're losing. Usually it comes down to one line: “But it calms me down.” It's the most honest-looking argument you have. And the most expensive con."
      },
      {
        "type": "p",
        "text": "Picture it: you're in the kitchen, the kettle is screaming, your kid is calling from the next room, a message from your boss is glowing on your phone. You step out onto the balcony, light up — and your shoulders drop. It looks like the cigarette released the tension. But let's slow the tape down and see what actually happened."
      },
      {
        "type": "h",
        "text": "Who's actually more anxious"
      },
      {
        "type": "p",
        "text": "Here's an inconvenient fact: research finds that smokers are, on average, more anxious than non-smokers — not less. Runs against everything the cigarette promises, doesn't it? If it really calmed people down, smokers would be the most serene people alive. It comes out exactly the other way round."
      },
      {
        "type": "p",
        "text": "And here's something almost nobody expects: for a lot of people, a few weeks after stopping, anxiety doesn't spike — it settles. The background gets smoother. Someone who spent years certain they smoked “because of nerves” suddenly notices they're on edge less often. Not because life got easier. Because one constant source of jitter got taken out of it."
      },
      {
        "type": "h",
        "text": "What you're mistaking for calm"
      },
      {
        "type": "p",
        "text": "Here's the trick. Nicotine leaves your blood fast. An hour or so after the last cigarette your body starts quietly dipping — a light unease, scattered attention, something nagging. You barely register it; you just feel slightly off. Then you light up — and you're back to normal. That level feeling you read as “I've calmed down” isn't a plus. It's just a return to zero from the small minus your previous cigarette put you in."
      },
      {
        "type": "p",
        "text": "You know how your arm goes numb if you sleep on it? You don't feel it while you're asleep — then you shift, the blood comes back, and warmth spreads through your arm, almost pleasure. Except that “pleasure” wasn't a gift from moving. It was manufactured by the numbness you'd been sitting in. A cigarette works the same way: first it quietly pinches the nerve of withdrawal, then lets go for a minute — and passes the relief off as a present."
      },
      {
        "type": "h",
        "text": "A second stress on top of the first"
      },
      {
        "type": "p",
        "text": "The real stresses haven't gone anywhere. A deadline, a row, money running out, a parent in hospital — that's actual life, and a cigarette doesn't touch it. What it does is add another layer on top. Every hour or two your body hands you a small dose of unease of its own — and you have to put it out. So on top of the real worries you're voluntarily paying for a background, artificial one that non-smokers simply don't have."
      },
      {
        "type": "p",
        "text": "Now picture a day with no cigarettes within reach. The meeting runs long, you're a guest and can't step out, the flight is delayed. Notice what happens to you: you can't think about anything except getting hold of a smoke. There it is — your number one supplier of panic. Not your boss, not the traffic, but the dependence itself. When you stop, you're not losing your calm. You're getting out of the obligation to rescue yourself every ninety minutes from something that's doing it to you in the first place."
      },
      {
        "type": "h",
        "text": "What actually calms you"
      },
      {
        "type": "p",
        "text": "The irritation lifts, but not because of nicotine — because of what you do around the cigarette without noticing. You leave the room — you change your surroundings. You stop — you put a pause between the trigger and your reaction. And above all, you make a slow, long exhale. Your body reads that exhale as “no danger here” and drops the revs. That's not mysticism, it's plain physiology: on a long out-breath your pulse eases slightly."
      },
      {
        "type": "p",
        "text": "The good news is you can keep the exhale, the pause and the change of scene, and bin the smoke. Walk to the window and back, step outside without a cigarette, stretch, pour a glass of water. It'll feel odd at first — your hand remembers the ritual and reaches to repeat it. That's normal, and it passes. And if the first days come hard, there are honest bits of support for those waves. A nicotine patch or gum smooths off the sharpest peaks, and prescription options are worth talking through with your doctor. There's nothing shameful in that and nothing to do with weakness: it's like taking an umbrella when you know it's going to pour. Support doesn't quit for you — it keeps you on your feet while the new habits settle in. And it works alongside those habits, not instead of them."
      },
      {
        "type": "p",
        "text": "Next we'll take apart another familiar excuse — that a cigarette supposedly helps you concentrate. The script turns out to be almost comically similar."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Take one slow exhale — longer than the in-breath. In for a count of four, out for a count of eight, lips pursed as if blowing out a candle across the room. Just once, no rush. Notice your shoulders drop a little on their own — with no smoke involved."
      },
      {
        "type": "p",
        "text": "This is educational text, not medical advice. Any stop-smoking medication, especially prescription-only, is something to discuss with your doctor."
      }
    ],
    "takeawayEn": "A cigarette doesn't put out stress — it starts the fire, then bills you for playing firefighter."
  },
  "focus": {
    "titleEn": "“It helps me concentrate”",
    "leadEn": "A cigarette doesn't give you your clarity back — it's the thing that took it.",
    "bodyEn": [
      {
        "type": "p",
        "text": "We've dealt with stress. But there's one more thing a cigarette supposedly does — and you believe in it even once everything else is in doubt. As if your head doesn't work without it. As if the drag is what pulls your thoughts together. This is probably the slyest illusion of all, because it doesn't pose as pleasure. It poses as usefulness."
      },
      {
        "type": "h",
        "text": "The fog that arrives on its own"
      },
      {
        "type": "p",
        "text": "Look at how it feels from the inside. You're sitting over a task — a report, some code, a conversation you need to think through. An hour goes by, maybe ninety minutes, and your thoughts start smearing. The lines slide past, you read the same paragraph a third time and can't tell what it says. A murky “I can't think any more” builds up inside."
      },
      {
        "type": "p",
        "text": "You step out, light up — and a minute later your head clears. You can work again. The conclusion writes itself: the cigarette gave you your concentration back. Makes sense — it was bad, you smoked, it got better."
      },
      {
        "type": "p",
        "text": "Except the cause has been swapped with the effect. That fog isn't your brain tiring from work — everyone gets that, and it comes later. It's mild nicotine withdrawal building up between cigarettes. Your body has got used to the substance, and when the level drops, you get exactly that scattered, irritable, “not firing” feeling. A non-smoker just doesn't have that kind of drop — sharp, out of nowhere, mid-afternoon. There's nothing to drop from: nobody inside is flipping the switch."
      },
      {
        "type": "h",
        "text": "The drag removes what the drag delivered"
      },
      {
        "type": "p",
        "text": "So it's a closed loop. The cigarette lets the fog in — a while after the last one. The next drag clears the fog. And you file that clearing under wins, as though you'd been handed something valuable. In reality you've just returned to the ordinary state a non-smoker lives in by default, free of charge, with no ritual by the door."
      },
      {
        "type": "p",
        "text": "It's as if someone were quietly turning your screen brightness down, then coming over and selling it back to you. You're grateful for the light. But you had the light already — until that someone got involved. A cigarette doesn't give you focus. It takes it first, then hands it back in pieces, one drag at a time, and charges your health and your time for the privilege."
      },
      {
        "type": "h",
        "text": "And what about everyone else"
      },
      {
        "type": "p",
        "text": "If concentration really ran on nicotine, the world would be built differently. A surgeon couldn't run a five-hour operation — they'd need a smoke break mid-incision. A pilot on a long haul wouldn't make it to landing with a clear head. An air traffic controller holding twenty aircraft in mind would have mixed them up long ago."
      },
      {
        "type": "p",
        "text": "But they work. Focused, for years, on tasks where the cost of an error is nothing like your report. The non-smoking student passes their exams. The non-smoking chess player calculates ten moves deep. They have no secret source of focus that you've been denied. Their attention just doesn't get snapped every hour or two — because there's nobody there to snap it."
      },
      {
        "type": "p",
        "text": "You know this from your own life. When you're genuinely absorbed in something — a film, a game, a conversation with someone you love — you don't jump up for a smoke. You can forget about cigarettes for a couple of hours and not notice. So the ability to concentrate is there, and it's yours. It never went anywhere — it just kept getting interrupted."
      },
      {
        "type": "h",
        "text": "What happens when you stop"
      },
      {
        "type": "p",
        "text": "Honestly: the first days your head may genuinely feel heavy. The fog you used to blow away with a drag now hangs around longer. That's disorienting — it looks like proof that you think worse without cigarettes. But it isn't a new state, it's an old debt your body is paying off. After that, the waves of fuzziness get shorter, rarer and weaker, and it's counted not in hours on a chart but in days and weeks — different for everyone."
      },
      {
        "type": "p",
        "text": "And then, usually, something quiet and rather nice happens. You catch yourself having sat with a task for an hour, two — with no pull to break off. The focus runs without those drops and without a top-up. That's the attention that was always yours; it just never got to work at full strength."
      },
      {
        "type": "p",
        "text": "One more thing — you'll still need breaks. Brains do get tired and do ask for a rest now and then, and that's normal. It's just that a break means standing up, stretching, looking out of the window, drinking some water. Not smoke. Smoke was the impostor here: passing off an ordinary need for a pause as a need for a cigarette."
      },
      {
        "type": "p",
        "text": "And if you want something more to lean on — a patch, gum, a prescription option from your doctor — that's not a white flag or a sign you're weaker than anyone. Think of it as a handrail: you hold on while the steps are steepest, then let go. Things like that work best next to what you're doing right now — taking the illusion apart piece by piece rather than trying to mute it with a tablet."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Next time you catch yourself thinking “I need a smoke to get my head straight” — give it two minutes. Don't smoke; just stand up, step away from the screen, take ten slow breaths and look at something far away, out of the window or across the room. Then come back to the task and watch: has your head cleared? If it has — that's the pause working, not the smoke. Remember that feeling."
      },
      {
        "type": "p",
        "text": "And to be clear: this is a book, not a prescription. What to add from the pharmacy, and when, is a decision for you and your doctor — they know your history; a page doesn't."
      }
    ],
    "takeawayEn": "A cigarette doesn't switch your focus on — it switches it off first, then sells it back one drag at a time."
  },
  "reward": {
    "titleEn": "The “reward” and the “wind-down”",
    "leadEn": "A cigarette doesn't give you back your calm — it gives you back the unease it created. Let's work out how to stop “earning” the thing that's robbing you.",
    "bodyEn": [
      {
        "type": "p",
        "text": "We've just been talking about how a cigarette supposedly helps you gather your thoughts. Now for the other side of the same day. Not the work, but the pause after it. That exact moment when you breathe out and think: “Right. Earned that.”"
      },
      {
        "type": "p",
        "text": "Task closed, dishes done, kids delivered, hard conversation survived — and your hand goes to the pack on its own. It feels like a little medal you award yourself. Like a full stop at the end of a sentence. And that's precisely why the “reward” link is the hardest one to take apart: it poses as something kind to you. Let's look at what's actually inside it."
      },
      {
        "type": "h",
        "text": "“I've earned it” — but earned what, exactly?"
      },
      {
        "type": "p",
        "text": "A simple mechanism is at work here — we've met it already. Nicotine leaves your blood within a couple of hours, and your body starts quietly whining: bring it back. All day you've been reading that whine as tiredness, as “a heavy day”, as just your temperament. And the evening drag simply switches the whining off for twenty minutes — and you call it a reward."
      },
      {
        "type": "p",
        "text": "Imagine you spent all day in a jacket with the zip stuck half a centimetre too tight — can't undo it, can't take a full breath. You got used to it, stopped noticing, put it down to the cut. Then in the evening the zip finally comes down — and what a relief! Except the relief isn't a gift. Something that had been stopping you breathing all day just stopped. It's the same with the cigarette: you've been handed back a scrap of the calm you had all the time, for free, before you smoked. That's not a bonus. That's the return of stolen goods, and you're saying thank you for it."
      },
      {
        "type": "p",
        "text": "The galling part is that your actual work, your real effort, has nothing to do with any of it. You did the thing. And somehow the pack hands out the medal. And every time round, you believe a little harder that without it the day doesn't get its full stop."
      },
      {
        "type": "h",
        "text": "Reward and rest existed before cigarettes — and they haven't gone anywhere"
      },
      {
        "type": "p",
        "text": "Think about how someone who has never smoked rests. They finish something — and they've simply finished. They sit down, breathe out, pour a tea, stare out of the window, stroke the cat, text a friend something daft. They don't need a separate ritual to “give themselves permission” to pause. The pause is already theirs."
      },
      {
        "type": "p",
        "text": "Relaxation isn't a substance you inhale. It's the state your body gets into when a load comes off it. A hot shower after a shift. The silence in the car when you've killed the engine and just sit for a minute. The first mouthful of water after a long dry stretch. Nicotine can't do any of that — all it can do is gag its own withdrawal and pass that off as bliss. Take it out of the picture and the shower, the silence and the water are all still there. What's left is clean rest, with no unease stitched inside it driving you after the next dose an hour later."
      },
      {
        "type": "p",
        "text": "For the first days without cigarettes the reward moment will feel oddly empty — your hand remembers the route. That's normal and it passes: cravings come in and roll back like surf, and every day the waves get shorter and weaker. Not to a timetable, not “exactly seventy-two hours and it lets go” — gradually. You're not losing the reward. You're learning to collect it directly, without a middleman taking commission out of your health."
      },
      {
        "type": "h",
        "text": "Breaking the “job done → cigarette” link"
      },
      {
        "type": "p",
        "text": "That link isn't innate — you trained it. Hundreds of evenings in a row: the finish and the drag arrived together, and your brain glued them. Now any “phew, done” reaches for the pack automatically. Good news: what got trained can be retrained. You don't have to cut the link with willpower in one go — you have to slowly teach it something else, putting something in the place of the smoke."
      },
      {
        "type": "p",
        "text": "What replaces the moment itself? Not “nothing” — emptiness is too much like the emptiness the cigarette used to fill. Replace it with a specific small action that has a beginning and an end, like a smoke break does. Finished the working day — step out onto the balcony and just stand for two minutes, looking at the street, no phone. Done the dishes — pour yourself something nice and drink it standing by the window. Got through the hard conversation — put on one track you love and listen to the end, doing nothing else."
      },
      {
        "type": "p",
        "text": "The point isn't to find a like-for-like substitute for a cigarette — there isn't one, and you don't need one. The point is to take back the idea of a pause as a reward, separately from nicotine. Within a couple of weeks your brain gets used to the balcony, the tea or the track being what ends the job — not the smoke."
      },
      {
        "type": "p",
        "text": "And if you slip somewhere along the way, that's not a collapse or “all that for nothing”. Treat it as a tip-off: this particular moment is still hard-wired to the cigarette, the seam here is stronger than you thought. Noticed it, filed it, moved on — one slip doesn't cross out the whole road, it just shows you where there's still learning to do. And if you decide to add sturdier support — nicotine gum, or whatever your doctor prescribes — that's not a white flag. It's like bringing a partner on a hard climb: they don't carry you, but the going is noticeably easier. Prescription options, of course, go through your doctor."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Think of the next “job” you'll finish today — the dishes, the work, the commute home. Right now, decide in advance how you'll reward yourself instead of a drag: one favourite track, two minutes at the window, or a hot tea standing up. Just say it out loud in one line — “when I'm done I'll put on that song.” That's it. You've just started retraining the link."
      }
    ],
    "takeawayEn": "You did the work — the reward is yours. The cigarette just slips you a bill for calm that was already yours."
  },
  "company": {
    "titleEn": "Boredom, company and the occasion",
    "leadEn": "Why a cigarette doesn't fill a pause but carries it off — and how to stand next to smokers and stay free.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Some habits have the cigarette built into an action — coffee, your hands, a familiar gesture. And then there's something subtler: the cigarette builds itself into emptiness. Into the gap between things, into the awkward silence at the bus stop, into that moment when there's nothing to do and it's too early to leave."
      },
      {
        "type": "h",
        "text": "The pause that got taken from you"
      },
      {
        "type": "p",
        "text": "Look at how it works. You're on the balcony, waiting for the kettle. Five free minutes. And your brain suggests: have a smoke, don't waste them. It looks as though the cigarette fills those five minutes. But try to remember honestly — what were you doing in them? You weren't resting. You were servicing a cigarette: got it out, lit it, dragged, tapped the ash, put it out. The pause was there. The cigarette didn't hand it to you — it just climbed inside and took up all the room."
      },
      {
        "type": "p",
        "text": "It's like the fellow passenger who talks non-stop the whole journey. The quiet was yours already — you were travelling, looking out of the window. But he filled every minute, and now it feels as though without him there'd have been no journey at all. A cigarette doesn't create the pause. It takes it and sells it back, passing it off as its own."
      },
      {
        "type": "p",
        "text": "A real pause is you standing there looking out at the street. Breathing. Doing nothing, and that being fine. Doing nothing used to feel awkward, and the cigarette covered the awkwardness. Now the awkwardness will pass on its own — within a few days your brain relearns that empty minutes don't need plugging. At first you'll feel the pull. After that, those moments become simply yours."
      },
      {
        "type": "h",
        "text": "What's actually valuable about the company"
      },
      {
        "type": "p",
        "text": "A smoke break with colleagues, or with friends outside — it was never about the smoke. It's about the fact that you went out, stepped away from the work, talked. About five minutes outside the work chat. About “so, how've you been?” The smoke is a passing acquaintance here, not the substance. But it stood next to those good minutes for so long that you started confusing them."
      },
      {
        "type": "p",
        "text": "Check for yourself. Those warmest conversations on a smoke break — were they because of the cigarette, or in spite of it? What you remember is your friend telling you something that mattered — not the drag you were taking at that moment. The connection is yours. The air is yours. The neighbour who heard you out isn't going anywhere if you come out without a pack. The smoke in those scenes was always the surplus — you'd just got used to not noticing."
      },
      {
        "type": "p",
        "text": "You can go out with smokers and not smoke. You can hold a cup of tea instead of a cigarette. You can stand there, chat, breathe the cool air — and be fully in it, not left out. People gather for the people, not for a shared pack."
      },
      {
        "type": "h",
        "text": "How to stand next to smokers and stay free"
      },
      {
        "type": "p",
        "text": "You'll be offered one. There'll be smoke under your nose. There'll be that moment when everyone's got theirs out and you haven't, and your fingers remember. This isn't a test of willpower — it's just an old path in your head that hasn't grown over yet. What helps here isn't gritting your teeth, it's changing the role. You're not “the one heroically holding out”. You're just someone who came out for a chat and doesn't smoke any more. Calmly, no announcement, no struggle."
      },
      {
        "type": "p",
        "text": "If someone holds out the pack — “thanks, I don't any more.” No lectures, no “did you know that…” The less drama, the easier it goes. The drama comes from the thought that you're missing out. But you're not the one missing out. That's the person standing downwind of the group, coughing, because they can't just be with people without it."
      },
      {
        "type": "p",
        "text": "And if at some occasion — a birthday, a barbecue, a couple of drinks — your hand goes out and you take a drag, that's not a wreck. That's one drag showing you your trigger, showing you where the ground is still soft. That's data, not a verdict — and we'll come back to it properly later. The main thing for now: one slip doesn't cancel out weeks without smoke, and the counter in the app doesn't reset. You haven't gone back to the start — you've learned something useful about yourself and you're carrying on."
      },
      {
        "type": "h",
        "text": "Boredom is not a reason to light up"
      },
      {
        "type": "p",
        "text": "“I'm bored, give us a smoke” is the strangest deal of the lot. Boredom needs something — anything: look out of the window, call someone, stretch, drink some water, go for a walk. A cigarette answers boredom not with an action but with smoke that makes your head heavy and your breathing worse. It's like chewing the wrapper instead of the food inside when you're hungry."
      },
      {
        "type": "p",
        "text": "Boredom is a normal human state. Sometimes there's nothing to do, and that's not an emergency you have to put out immediately. If you want to occupy your hands and your head, occupy them. But honestly: whatever you pick out of boredom ought to give you something. A cigarette doesn't. It takes — minutes, breath, money — and leaves you nothing but a reason to light the next one."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Think of one place where you smoked “out of boredom” or “to be sociable” — the balcony, the yard, the spot outside work. Right now, stand there for 30 seconds in your head with no cigarette: what do you see, what do you hear, what does the air smell like. That pause was yours without the smoke too. Tomorrow, when you're actually there, just be in it — breathe, and walk on."
      }
    ],
    "takeawayEn": "A cigarette doesn't fill an empty minute — it moves in and charges you rent."
  },
  "ritual": {
    "titleEn": "Hands, coffee, ritual",
    "leadEn": "Half the cigarettes in your life aren't about nicotine — they're about a script, and scripts are easy to rewrite.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Some cigarettes you don't seem to choose at all. Poured a coffee — reached for the pack. Finished lunch — stood up and went out. Got behind the wheel — clicked the lighter before the indicator. Your hand knows the way better than you do. And that feeling — “I didn't even get a chance to think” — is the most frightening part. It seems like there's something chemical and ungovernable sitting inside you."
      },
      {
        "type": "p",
        "text": "Good news: it isn't chemistry. It's habit. And you can see straight through a habit once you know where to look."
      },
      {
        "type": "h",
        "text": "Coffee demands nothing. The script does"
      },
      {
        "type": "p",
        "text": "Nicotine has no idea you're drinking coffee. It doesn't care whether it's lunch or a meeting, a balcony or a bus stop. It has no eyes. The “coffee → cigarette” link wasn't built by it. It was built by you, over hundreds of repetitions. Every morning you put those two actions side by side, and your brain drew the conclusion it always draws: if they come together, one must cause the other. That's how coffee and a drag get glued, and food and a smoke break, and a phone call and a pack in your hand."
      },
      {
        "type": "p",
        "text": "Imagine that for six months you'd had one square of chocolate with every cup of coffee. After six months, coffee without the chocolate would feel incomplete — like something's missing. But that doesn't mean coffee contains a craving for chocolate. It's just a pair you assembled yourself. Same with the cigarette. You don't feel bad without it — you feel unaccustomed. And that's a completely different feeling, even though it does a good impression of the first one."
      },
      {
        "type": "h",
        "text": "Associations fall apart faster than you'd think"
      },
      {
        "type": "p",
        "text": "And here's the most encouraging bit. The only thing holding the link together is repetition. Stop feeding it and it starts to melt. The first few times you'll feel it: you've had your coffee, your hands have nowhere to be, and something itches — “where is it?” But if you don't light up in that moment, your brain gets new evidence: there was coffee, there was no cigarette, and nothing terrible happened. Note that to yourself — there's your proof that the pair comes apart."
      },
      {
        "type": "p",
        "text": "After a few repetitions the same coffee stops tugging at your sleeve so insistently. Then quieter still. It's important not to confuse two different things here. Everyday couplings aren't the heavy wave that rolls over you in the first days without cigarettes and then fades out. A ritual habit is built far more simply: it doesn't need to wait for your body to readjust. All it needs is to see, a couple of times, that the script now runs without a cigarette — and it lets go. That's why couplings like these break up in days, sometimes a couple of weeks, not months."
      },
      {
        "type": "p",
        "text": "And if one day you do light up with your coffee — it isn't “all for nothing”. It just means this particular coupling is still alive and worth uncoupling on its own. One time like that is a tick on your map of triggers: right, the morning coffee has a stronger grip than the rest. Not a verdict — a pointer to where to look tomorrow. The counter in Breeze doesn't reset over one cigarette — and there's no reason for you to reset yourself either."
      },
      {
        "type": "h",
        "text": "Occupy your hands and your mouth — and rewrite the scene"
      },
      {
        "type": "p",
        "text": "Quitting by heroic endurance is a poor strategy. Sitting with your fists clenched, glaring at a steaming cup of coffee like an enemy — that doesn't last. It's far smarter not to endure the emptiness but to fill it. A ritual has two physical parts: what your hands are doing and what's in your mouth. Cover those."
      },
      {
        "type": "p",
        "text": "Hands like small, turning things: spin a pen, click a stapler, sort through your keys, knead a bit of putty by the keyboard, tidy one drawer. Your mouth needs movement and taste: water with lemon in small sips, a mint toothpick, sunflower seeds, a slice of apple, sugar-free gum, a boiled sweet. It sounds trivial, but it's exactly that trivia that kept the cigarette in your hand — so trivia is what replaces it."
      },
      {
        "type": "p",
        "text": "And the main move — change the scene itself rather than cutting a piece out of it. Not “coffee minus cigarette” (a hole you'll want to fill), but “coffee plus something new”. Drink it by the kitchen window instead of the usual balcony. Use a different mug. Put on a couple of minutes of music. After lunch, don't head to the old smoking spot — walk round the block instead. You're not fighting the old script — you're writing a new one over the top of it, and the old one simply runs out of room in the frame."
      },
      {
        "type": "p",
        "text": "Incidentally, it happens that a doctor has set you up with NRT or another medication. Then it works like soundproofing in a room where a drill had been grinding away: the background noise drops, and you sit down to write the new scenes in quiet rather than trying to shout over the craving. It isn't a replacement for your work on the habits — it's a desk-mate. And it's certainly not a white flag; rather the opposite, someone picked a smarter tool."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Right now, pour yourself some water or that same coffee and take a couple of sips holding the mug in both hands. Just feel it: hands occupied, taste in your mouth, nothing burning — and you're perfectly fine. That's what your new morning looks like."
      },
      {
        "type": "p",
        "text": "This is educational text and support, not medical advice. Any medication is prescription-only, and that decision is one you make with your doctor."
      }
    ],
    "takeawayEn": "You don't feel bad without a cigarette — you feel unaccustomed. And unaccustomed becomes accustomed faster than you think."
  },
  "too-long": {
    "titleEn": "“I've smoked for too long”",
    "leadEn": "Years of smoking aren't a verdict. The body knows how to repair itself at any age — and “it's a shame to quit after all this time” is the cleverest trap of them all.",
    "bodyEn": [
      {
        "type": "p",
        "text": "There's a thought that doesn't show up by the ashtray — it comes from somewhere deeper. Not “I want a cigarette,” but “it's too late for me.” You were holding a coffee, turning the pack over in your fingers, catching yourself mid-ritual — and quietly decided none of this comes off anymore. Too many years. Too deep in. This chapter is about the fact that “too late” is lying to you."
      },
      {
        "type": "p",
        "text": "Let's take it apart calmly, no slogans. Because “I've smoked too long” is hiding two different things, and both fall apart the moment you actually look at them."
      },
      {
        "type": "h",
        "text": "Your body isn't counting your years"
      },
      {
        "type": "p",
        "text": "There's no accountant inside you who wrote down twenty years of smoking and now refuses to hand your health back until the sentence is served. The body is simpler and kinder than that: it starts repairing from your last cigarette, not your first. It doesn't care what came before. It cares about one thing only — is there smoke right now, or isn't there."
      },
      {
        "type": "p",
        "text": "Picture an old flat where people smoked in the kitchen for years. Yellow ceiling, smell in the curtains, film on the windows. It seems soaked in forever. Then someone opens a window, washes the glass, launders the curtains. A couple of weeks later you can hardly believe it was ever like that. Same walls. Same flat. They just stopped adding soot — and it started leaving on its own."
      },
      {
        "type": "p",
        "text": "Your body works the same way, only more alive. For many people the blood starts carrying more oxygen within the first days — carbon monoxide from the smoke used to eat into it, and now it clears out. Then stairs get a little easier, food keeps its taste longer, breathing settles at night. Not because you're a hero — because you simply stopped topping it up. And the tiny hairs in the lungs that lay flattened for years slowly lift and go back to work. That isn't poetry, it's ordinary physiology, and it doesn't care whether you're forty or sixty-five."
      },
      {
        "type": "h",
        "text": "The “shame to throw it all away” trap"
      },
      {
        "type": "p",
        "text": "The second thought is sneakier. “I put so many years into this — money, time, habit. Quitting now would be admitting it was all for nothing.” So you keep paying for old cigarettes with new ones, just to keep them from being a mistake."
      },
      {
        "type": "p",
        "text": "It's a familiar trap, and it isn't only about smoking. You buy a cinema ticket, and twenty minutes in you know the film is dull. But you sit it out. Why? “I paid for it.” The money is gone either way — and now you're handing over two hours of your life as well, just to avoid admitting the ticket was a dud. Walking out would be smarter. Staying is paying twice."
      },
      {
        "type": "p",
        "text": "Same with cigarettes, only the stakes are higher. Those past years are spent — that's true, and no cigarette you smoke will unspend them. But every new pack doesn't buy back the past, it takes from the future. You're not recouping, you're just adding to the pile. A long history isn't a reason to keep going. It's the loudest possible argument to stop: you've already given plenty."
      },
      {
        "type": "h",
        "text": "The past is closed. The future isn't."
      },
      {
        "type": "p",
        "text": "Let's be honest here. Quitting doesn't reset the counter. The past won't erase, and promising you'll “end up like someone who never smoked” would be a lie. But the future is built differently: it isn't written yet. And every smoke-free day isn't a debt repayment — it's already profit. An evening you got through calmer. Money that didn't burn. A morning without that weight in your chest."
      },
      {
        "type": "p",
        "text": "Count forward, not back. Behind you there's only what already happened; poking at it is pointless. Ahead, everything is open. The first day pays for itself on the first day: your body has already started working for you instead of against you. You don't have to wait a year for it to “be worth it.” It's worth it from the first breath out."
      },
      {
        "type": "p",
        "text": "And if it gets hard — and the first days usually are the hardest — that doesn't mean it's “already decided” for you and your years have lost the game in advance. No length of history makes you the special case who's past saving. If you stumble, it'll just be a stumble, one episode, not a verdict on every year you've lived. Your history isn't the judge. It's behind you. You're deciding here."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Right now, thirty seconds: put a hand on your chest and take one calm breath — not deep, not for show, just attentive. Feel your ribs rise and fall under your palm. That's your body breathing on its own, without a cigarette, exactly the way it breathed when you were a kid, before the first drag. It still knows how — your years have nothing to do with it. You can start on any breath. And the best one is this one."
      }
    ],
    "takeawayEn": "The body repairs from your last cigarette, not your first. A long history isn't a debt to keep paying — it's a bill that's overdue to close."
  },
  "withdrawal": {
    "titleEn": "The truth about withdrawal",
    "leadEn": "An honest look at how coming off nicotine actually goes — no horror stories, no sugar-coating.",
    "bodyEn": [
      {
        "type": "p",
        "text": "You already know it isn't about how many years are behind you. Your smoking history isn't a verdict, it's just a number. Now let's talk about what nearly everyone who keeps postponing day one is afraid of. Withdrawal."
      },
      {
        "type": "p",
        "text": "So much has been piled onto that word that it's frightening to even walk up to it. As if quitting means going down into a cellar where something unbearable is waiting. Let's switch the light on and see what's actually in the corner. Usually it's a mop and an old bicycle."
      },
      {
        "type": "h",
        "text": "It's real — but it isn't the movie version"
      },
      {
        "type": "p",
        "text": "Straight up: withdrawal exists. Your body got used to nicotine on a schedule, and when the schedule breaks, it grumbles. That's not invented and it isn't “all in your head.” Mild irritability, scattered attention, wanting something to chew, sleep that goes off, that sense of something missing in your hands — all of that happens."
      },
      {
        "type": "p",
        "text": "But a lot of people are carrying a completely different picture — the one from films about hard drugs. Shaking hands, cold sweat, someone on the floor. Nicotine isn't in that league. Judge for yourself. For most people, quitting feels roughly like a heavy coffee drinker's first morning without coffee. Head a bit foggy, mood swinging, pull toward the usual. Unpleasant — yes. Unbearable — no."
      },
      {
        "type": "p",
        "text": "Some people get off lighter, some get it rougher — it's individual, and that's normal. If it hits hard or drags on, especially if it presses on your sleep or your mood, it doesn't mean something's wrong with you. It means don't play hero alone: lean on tools, or talk to a doctor. Asking for support isn't weakness, it's common sense."
      },
      {
        "type": "p",
        "text": "And here's the thing worth feeling properly: the fear of withdrawal is usually much bigger than withdrawal. You paint yourself a hell in advance, then you arrive and find a draught and a creaky door."
      },
      {
        "type": "h",
        "text": "Loudest at the start, then it comes in waves"
      },
      {
        "type": "p",
        "text": "I won't lie to you about exact hours and days — as if it lifts at some precise moment, like an alarm going off. Everyone's different, and a body isn't a timer. But the general shape is the same for everyone."
      },
      {
        "type": "p",
        "text": "The first days are the noisiest. Your body is loudest about the habit because the break is still fresh. And then something worth remembering kicks in: craving comes in waves. It doesn't hang over you as one flat drone all day long. It rolls in — and rolls back out. It rises, holds at the crest for a minute or two, and drops."
      },
      {
        "type": "p",
        "text": "And with each day those waves get shorter, rarer and weaker. Picture the surf after a storm: at first it hits hard and often, then it settles, and soon it's just ripples at the shore. This happens over days and weeks, not hours. But it moves one way. Down."
      },
      {
        "type": "h",
        "text": "It isn't the body that hurts — it's the thought"
      },
      {
        "type": "p",
        "text": "Now the observation this whole chapter is for. When craving hits, it feels like your body is suffering. There is a physical side, sure — but most of the noise is in your thinking. Your skin isn't itching, your bones don't ache. What nags is an idea: “right about now, I'd…” One insistent thought, going round and round, promising it'll all be easier the moment you light up."
      },
      {
        "type": "p",
        "text": "Catch that difference — it changes everything. Most of the time you're not in pain. You're being thought at, insistently, about a cigarette. And unlike pain, a thought can simply be waited out. It can't move your hand. It can only make loud suggestions."
      },
      {
        "type": "p",
        "text": "And this is where a lot of people go wrong: they grit their teeth and endure. Holding on with everything they've got, as if the wave were an enemy to be crushed. But the harder you brace against it, the heavier it gets. There's a smarter way."
      },
      {
        "type": "h",
        "text": "Ride the wave, don't fight it"
      },
      {
        "type": "p",
        "text": "A surfer doesn't try to stop a wave — that's impossible and pointless. They stand on the board and glide until the wave runs out of breath on its own. Craving works the same."
      },
      {
        "type": "p",
        "text": "When it rolls in, don't fight. Notice it. Say it to yourself calmly: “Oh, hello. Craving's here. It'll rise, hold, and drop.” Watch it from the outside, like weather through a window. Where is it in your body? Chest, throat, hands? Just look, no panic. And breathe. The wave hits its peak — and starts falling by itself, without any effort from you. All you have to do is not jump off the board in those minutes."
      },
      {
        "type": "p",
        "text": "That's what riding a craving is. Not white-knuckling it, but following the wave with your eyes all the way to shore. It gets easier every time — because by then you know it passes, since the last one did."
      },
      {
        "type": "p",
        "text": "One more thing. Sometimes the waves hit hard enough that one board isn't enough — and there's nothing shameful in that. Patches, gum and prescription options are on your side here. That's not a white flag, and not a crutch for people who “couldn't do it alone.” It's more like a warm jacket when the water's freezing: it doesn't make you a worse swimmer, it just lets you stay in longer without seizing up. And they work alongside what you're learning here, not instead of it. Which prescription option might suit you is a conversation with a doctor — not with me, and not with an app."
      },
      {
        "type": "p",
        "text": "And if a wave does go over your head and you smoke — that's not a failure and it's not “all ruined.” It's a line in your notes: this wave, this moment, turned out to be stronger for now. Once is once, not a turn back to your old life. And Breeze is on your side here: your counters don't reset, nobody knocks you back to zero. You just learned a bit more about your own waves than you knew yesterday."
      },
      {
        "type": "p",
        "text": "By the way — while your body is learning to live without nicotine, it's already repairing itself, and fairly quickly. But that's for later: what recovers, and roughly in what order."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Think of your last strong craving. Now set a minute and breathe: in for a count of four, slow out for six. Just watch the air come in and go out. This is your practice board — calm water, no wave yet. When the real one comes, you'll already know the move."
      },
      {
        "type": "p",
        "text": "This is educational text, not medical advice. NRT (patches, gum) is available over the counter; cytisine, bupropion and varenicline are prescription-only, through a doctor."
      }
    ],
    "takeawayEn": "Craving is a wave, not a wall: you climb walls, you glide over waves."
  },
  "body-heals": {
    "titleEn": "What repairs itself in your body",
    "leadEn": "Your body starts repairing itself — some things in days, some over years. Here's an honest map, without the magic clock.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Last chapter we worked out that waves of craving aren't a verdict, just weather that changes. Now for the good part. While you're riding those waves, repair work is already under way inside you. Quiet, no fanfare, but real."
      },
      {
        "type": "p",
        "text": "One thing to agree on first. There are pretty tables all over the internet: “at 20 minutes this, at 8 hours that, at 12 hours the other.” It looks inspiring, but half those numbers are marketing, not biology. A body isn't a microwave with a timer. It repairs at its own pace, and that pace is different for everyone. So let's drop the stopwatch and just be honest about what happens and roughly when."
      },
      {
        "type": "h",
        "text": "The first weeks: things come back that you'd nearly forgotten"
      },
      {
        "type": "p",
        "text": "The most noticeable stuff arrives fast — breathing, taste and smell. A smoker spends years with the senses turned down, as if someone laid a thin blanket over the world: everything's there, just muffled. And then the blanket comes off."
      },
      {
        "type": "p",
        "text": "A familiar story: someone quits, a week or so goes by, they walk into their building and suddenly smell the stairwell. Someone's dinner behind a door. Damp in the corner. Coffee brewing a floor up. The smells were always there, you just weren't catching them. Same with food. A plain supermarket tomato turns out to be an actual tomato instead of red watery nothing. Bread starts smelling like bread again."
      },
      {
        "type": "p",
        "text": "Breathing shifts early too. Not that you'll suddenly run a marathon — but getting up three flights without stopping on the landing to catch your breath somehow gets easier than it was. Small thing, but you notice."
      },
      {
        "type": "h",
        "text": "Months: the lungs tidy up"
      },
      {
        "type": "p",
        "text": "Cough and breathlessness, though, aren't a matter of weeks. Be patient here, because it can feel unfair. A lot of people expect to quit and breathe easier immediately. In reality you might cough more at first. And people get scared: “I quit — why is it worse?”"
      },
      {
        "type": "p",
        "text": "Here's the simple version. Your lungs have tiny hairs — something like an escalator carrying junk up and out. Smoke paralyses that escalator, so the rubbish has been piling up down there for years. You quit, the escalator wakes up, and it starts clearing the backlog. That cough isn't a breakdown, it's housekeeping. Your body is carrying out what should have gone out long ago. A month or two and it quietens down. Breathlessness eases on the same kind of timescale: not over a weekend, but step by step, across weeks and months."
      },
      {
        "type": "p",
        "text": "Important not to mix things up, though. If a cough drags on, feels off, or brings blood — that isn't “repair,” that's a reason to see a doctor rather than sit and guess. An app is no adviser here. Lung health gets checked by a person in a white coat, not by an article."
      },
      {
        "type": "h",
        "text": "Months and years: the heart plays the long game"
      },
      {
        "type": "p",
        "text": "The heart and blood vessels repair slowest of all — and that's probably the most important news, even though it's the least visible. You won't feel it the way you feel the smell of coffee. There's nothing to sniff, nothing to notice day to day. Somewhere inside, across months and years, the risks smoking spent years stacking up quietly roll back."
      },
      {
        "type": "p",
        "text": "Think of it as a loan you're paying off. Every day without cigarettes is a small payment against a debt your body has been carrying. Nothing shows straight away. But a year in, the picture is different from what it was. A few years in, different again. It's the kind of work that gives you no feedback right now, which is exactly why it's easy to forget about. But it's happening, even when you don't notice."
      },
      {
        "type": "h",
        "text": "Why “felt it” beats “know it”"
      },
      {
        "type": "p",
        "text": "And here's the interesting part about motivation. Numbers about vessels and risk percentages are for your head. They're correct, but cold. What you felt yourself is a completely different weight class."
      },
      {
        "type": "p",
        "text": "It's one thing to read “lung function improves.” It's another to notice you ran half a block for a bus and didn't fold in half at the stop. One thing to know taste comes back. Another to bite into a tangerine in December and catch yourself thinking “oh — that's sweet.” That “oh” works harder than any table. Your body keeps handing you evidence that you're holding on for a reason. Catch them and bank them — on a hard evening they weigh more than any statistic."
      },
      {
        "type": "p",
        "text": "As for the fears about weight, nerves and “I'll turn into a different person” — that's its own conversation, and it's next chapter. It's less frightening there too than it looks from the start."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Take one slow breath through your nose — deep, all the way down — and just listen: what does it smell like where you are? Find one smell that used to pass you by. That's the repair work, happening this minute."
      },
      {
        "type": "p",
        "text": "And one last honest note: this is how recovery tends to go for most people, not a promise made to you personally. Every body has its own pace and its own quirks, so for your own picture go to a doctor, not to these lines."
      }
    ],
    "takeawayEn": "Your body doesn't repair on a timer from the internet — it does it its own way: some things in weeks, some over years. Your job is to stay out of the way and notice."
  },
  "fears": {
    "titleEn": "Weight, nerves and other fears",
    "leadEn": "We take apart what nearly everyone quitting is afraid of — and watch fear lose its grip once you can see how it's built.",
    "bodyEn": [
      {
        "type": "p",
        "text": "You already know your body starts repairing itself without any effort from you. But right next to that good news there's almost always a small list of fears. They show up before you've even stubbed out the last cigarette, and they whisper. Let's drag them into the light one at a time and take each apart — because fear holds on while it stays a vague silhouette, and melts the moment you see it in detail."
      },
      {
        "type": "p",
        "text": "Notice one thing: almost none of these fears are about today. They're about some future you who doesn't exist yet. “What if I get fat.” “What if I lose my mind.” An imagined disaster always looks bigger than a real one — because imagination has no details and no way out, just naked dread in close-up."
      },
      {
        "type": "h",
        "text": "Fear one: “I'll balloon”"
      },
      {
        "type": "p",
        "text": "Honestly, no gloss: some people do put on a couple of kilos in the first months. Not everyone. Not necessarily. And definitely not “a size bigger forever.” The figure usually quoted is somewhere around two to four kilos; some gain more, some nothing at all. If you've put on a bit more than average, it doesn't mean something went wrong. It's not a verdict — it's something you can steer."
      },
      {
        "type": "p",
        "text": "Where the weight comes from at all. A cigarette dulled your appetite slightly and nudged your metabolism up a touch — pocket change against a huge bill. When it goes, food tastes good again and your hands go looking for something to do. And there you are at the fridge, not because you're hungry, but because three in the afternoon used to be a cigarette, and now it's an empty slot that a biscuit fills fastest."
      },
      {
        "type": "p",
        "text": "See the mechanism, see the volume knob. This isn't hunger, it's your hand and mouth hunting for a ritual. A glass of water, a walk to the window, a handful of nuts instead of a pack of biscuits. A body that's stopped paying for smoke with oxygen will want to move on its own within a couple of weeks — and the scales will register that. Weight isn't the enemy here, just another process with a cause. And a cause is always something you can negotiate with."
      },
      {
        "type": "h",
        "text": "Fear two: “I'll turn into an angry mess”"
      },
      {
        "type": "p",
        "text": "The first days you really might be prickly. You snap at someone you love over nothing, you're twitchy in a queue, it seems like the whole world has agreed to wind you up. And then the sly thought arrives: “so this is the real me — without cigarettes I'm unbearable.”"
      },
      {
        "type": "p",
        "text": "That's not true, and here's why. The irritability of those days isn't your character surfacing. It's withdrawal. Your brain got used to a dose every hour and now it's throwing a strop, like a toddler whose dummy got taken. Loud, but not for long. The first days are the hardest, then the waves come shorter, rarer and weaker — not on a schedule, they just fade out, over days and weeks."
      },
      {
        "type": "p",
        "text": "Compare it to a cold. When you're aching and your nose is streaming, you don't think “well, this is me now, permanently ill.” You know it'll pass, it's a temporary state, not a new version of you. Irritability is exactly the same. You don't have to become someone through it — you just have to go through it. If it isn't prickliness, though, and your mood stays low and won't lift for weeks, that's a reason to calmly see a doctor rather than tough it out alone."
      },
      {
        "type": "p",
        "text": "And these days can be made softer — there's support available. A patch or nicotine gum takes the edge off some of the tension, and for some people a doctor may prescribe tablets. That's not a white flag and not a sign you're weaker than anyone else. It's like taking an umbrella when you already know it'll rain: not “couldn't manage alone,” just sensible. That kind of support works best alongside your decision, not instead of it."
      },
      {
        "type": "h",
        "text": "Fear three: “I'll become boring”"
      },
      {
        "type": "p",
        "text": "This one's the sneakiest, because it pretends to be your own voice. “Without a cigarette I can't really unwind.” “Nights out with friends will go flat.” “What's morning coffee without one.” It sounds like your personal opinion. It's actually the dependence talking — in the only way it knows how to hold on: by frightening you that life without it is worse."
      },
      {
        "type": "p",
        "text": "Catch it out on the contradiction. A cigarette never added flavour to your coffee or meaning to a conversation. It just took away, for a minute, the withdrawal it created an hour earlier. What you took for “the bliss of relaxing” was only the relief of the dependence backing off for a while. It's like scratching a mosquito bite: it feels good precisely because it itched unbearably first. Remove the mosquito — nothing to scratch, and your hands are free."
      },
      {
        "type": "p",
        "text": "What makes a person boring isn't the absence of smoke, it's boredom on the inside. Someone who could laugh with friends doesn't forget how without a pack in their pocket. If anything — without constantly slipping out to the balcony, you'll be where it's all actually happening, all of you."
      },
      {
        "type": "h",
        "text": "Why fears melt"
      },
      {
        "type": "p",
        "text": "Notice what they had in common? Every one of these fears rested on the same thing — not knowing what was inside it. “I'll get fat” — until you saw that weight is just a hand looking for something to do. “I'll get angry” — until you understood it's withdrawal, not character. “I'll be boring” — until you spotted that it isn't your voice, it's the trap's. Under the bonnet of each fear there was an ordinary, understandable mechanism. And a mechanism you can do something with — unlike a nameless “what if.”"
      },
      {
        "type": "p",
        "text": "One more thing to carry forward: if you stumble somewhere along the way, it doesn't cross out everything before it. One cigarette doesn't rewind you to the start, it just shows you which moment caught you out. Treat it as a clue, not a verdict. But that's next chapter — separately, and in detail."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Take one of your fears — the loudest one. Say it out loud or write it in a single line, then add: “but really this is…” and finish it with a mechanism, not a horror. For example: “I'm scared of putting on weight — but really this is just my hand looking for something to do instead of a cigarette.” One minute. A fear called by its name gets smaller straight away."
      },
      {
        "type": "p",
        "text": "This is a supportive book, not medical advice: decisions about medication and any worrying symptoms belong with your doctor, and prescription options only go through them."
      }
    ],
    "takeawayEn": "Fear is fog. Switch on the light, see the mechanism — and there's nothing left to be frightened of."
  },
  "lapse": {
    "titleEn": "You haven't failed",
    "leadEn": "One cigarette isn't the end of the road — it's a line of data about where your weak spot is.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Fear of gaining weight, fear of losing your usual comfort — we've worked through all of that. But there's one more fear that holds tightest: the fear that you'll slip again. So you hold on a week, two, and then at someone's birthday you take one — “just to join in.” And that's it. Something snaps inside: “There we go, couldn't do it again.”"
      },
      {
        "type": "p",
        "text": "Let's stop right here. Because this is the second where the real thing gets decided — and you're the one deciding, not the cigarette."
      },
      {
        "type": "h",
        "text": "“Quit a hundred times” means a hundred rounds of experience"
      },
      {
        "type": "p",
        "text": "There's the old line: “Quitting is easy, I've done it a hundred times.” People usually drop it with a bitter grin — look how hopeless I am. Now turn it over. A hundred attempts is a hundred times you've already seen exactly how it hooks you."
      },
      {
        "type": "p",
        "text": "Every past slip left you a clue. One time you went down on the very first Friday evening, when you opened a beer. Another time, after a row with your partner, out on the balcony to cool off. Another on a work call that dragged on two hours. That's not a list of your disgraces. It's a map. A map of where the road gives way, and where you'll need to step carefully next time."
      },
      {
        "type": "p",
        "text": "Someone quitting for the first time is walking blind. You're not. You've done reconnaissance under fire. The only sad part is that this intel usually gets filed under “I'm a failure” instead of being used as a map."
      },
      {
        "type": "h",
        "text": "The trap of one thought"
      },
      {
        "type": "p",
        "text": "The dangerous thing about a slip isn't the cigarette. It's the thought that comes right after it: “Well, the programme's broken, I'm smoking again.” That thought is the actual break. Call it plainly — the broken-promise effect: you gave yourself your word, you broke it yourself, and immediately decided that since it's broken you may as well go all the way."
      },
      {
        "type": "p",
        "text": "Picture it: you're on a diet, and in the evening you cave and eat one sweet. If you think “day's ruined, I'll finish the box and start again Monday” — you'll finish the box. Honestly, the damage from one sweet is one sweet. Everything else gets eaten not by hunger, but by that “it's all ruined” thought."
      },
      {
        "type": "p",
        "text": "Same with a cigarette. One drag at a birthday is one drag. The nicotine from it is negligible, and a day later there's none of it left. But if “if I've smoked, I'm a smoker again” comes next, then you keep smoking not because of nicotine. You keep smoking because of the sentence you passed on yourself. A slip turns into a return not through chemistry, but through one phrase in your head."
      },
      {
        "type": "p",
        "text": "That's why in Breeze your counter doesn't reset over one cigarette. That isn't leniency or playing along. It's the truth: one slip doesn't erase the weeks you've already walked. The only thing that erases them is deciding to “start from zero” — and you're not obliged to decide that."
      },
      {
        "type": "h",
        "text": "A slip and a return are different things"
      },
      {
        "type": "p",
        "text": "Two words get confused constantly, so let's separate them. A slip is one cigarette, one evening, one weak minute. A return is smoking every day again, like before. There's no automatic bridge between them. You build that bridge yourself — with each cigarette after the first. Or you don't."
      },
      {
        "type": "p",
        "text": "Between the first drag and a pack the next day there's a gap. In that gap you decide: “that was a one-off, I'm not smoking from here” — and the bridge collapses before it exists. Or “well, since we're at it” — and you lay the first plank. Nicotine takes no part in that choice. Only you do."
      },
      {
        "type": "p",
        "text": "And if you decide to bring in something — a patch from the pharmacy, or whatever your doctor prescribed — drop the idea that it's a white flag. It's more like a second pair of hands: you keep hold of the wheel while someone beside you damps the sharpest jolts of craving, and the gap where you get to think widens a little. It works with your head, not instead of it — and it works best exactly when you've already seen through how the trap is built."
      },
      {
        "type": "h",
        "text": "What to do right after a slip"
      },
      {
        "type": "p",
        "text": "The routine is simple, and it fits into three steps. First — acknowledge it without drama. Not “I'm worthless,” but dry, like a mechanic about a car: “Okay, there was a cigarette.” Full stop. No inner courtroom, no prosecutor and no defence — that's the glue that turns one slip into ten."
      },
      {
        "type": "p",
        "text": "Second — look at the minute before it. Where were you, who with, what did you feel? Boredom, anger, a drink, someone else's smoke under your nose? That's your trigger — the very thing we'll take apart properly next chapter. For now, just notice it and write it down. You've added one more mark to your map."
      },
      {
        "type": "p",
        "text": "Third — come back immediately. Not “from Monday,” not “from the first of the month,” not “I'll finish this pack and then quit.” Now. The next cigarette you didn't smoke is your return. The shorter the pause between the slip and the return, the less chance the bridge ever starts getting built."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Think of your last slip — any of them, even years ago. And in one line, no judgement, answer yourself: where were you and what did you feel right before that cigarette? It takes a minute — and you'll be holding the first mark on your personal map of triggers. Not a verdict. Data."
      },
      {
        "type": "p",
        "text": "And a short note about the medication above: this is educational text, not medical advice. What to bring in, and whether to bring anything in at all, isn't decided by you alone or by an app — it's you together with your doctor."
      }
    ],
    "takeawayEn": "A slip isn't “back to square one.” It's “this is where it was waiting for me” — and now you know the route."
  },
  "triggers": {
    "titleEn": "Triggers, and how to defuse them",
    "leadEn": "Cravings rarely come out of nowhere — there's almost always a trigger, and you can spot it in advance.",
    "bodyEn": [
      {
        "type": "p",
        "text": "You've probably noticed something odd. A whole morning goes by without a single thought about smoking. Then one meeting, one call from your mother, one traffic jam on the way home — and your hand is already in your pocket. Cravings rarely show up on their own schedule. There's almost always something that pulls the trigger."
      },
      {
        "type": "p",
        "text": "That something is what we call a trigger. The smell of coffee. An empty kitchen at eleven at night. Your boss's voice. A glass of wine on Friday. For years your body tied those moments to a drag, and now it dutifully pulls the habit off the shelf the moment it recognises the scene. That's not weak character. It's a learned route — and routes can be re-laid."
      },
      {
        "type": "h",
        "text": "Four old acquaintances: hungry, angry, lonely, tired"
      },
      {
        "type": "p",
        "text": "There are four states that cravings feed on more than any others. In English they're bundled into one word: HALT — Hungry, Angry, Lonely, Tired. Handy, because the word itself is an instruction: notice one of the four, and stop for a second."
      },
      {
        "type": "p",
        "text": "Hunger creeps up unnoticed. You don't want a cigarette — you want food, your brain just crossed the wires, because a drag used to stand in for lunch. Anger is the hottest of the four: right after a fight it feels like a cigarette will cool you down. It won't. It just buys five minutes of pause — and you could have taken those five minutes on the stairs anyway. Loneliness is the evening when everyone has gone home and the habit offers itself as company. Tiredness is the end of the day, when there's no willpower left for anything and giving in is simply easier than pushing back."
      },
      {
        "type": "p",
        "text": "Here's the trick: almost always, what you need isn't a cigarette. You need to eat, cool off, call someone, or go to bed. The cigarette just shouts the loudest that it'll fix things — while the actual fix is food, a shower, sleep, or a real voice on the phone."
      },
      {
        "type": "h",
        "text": "An if–then plan, written ahead of time"
      },
      {
        "type": "p",
        "text": "The weakest point is the moment the wave hits. Right then, thinking is hard and negotiating with yourself is pointless. So you don't decide in the middle of it — you decide before. Calmly, with a cool head, you lay it out in advance: if this happens, I do that."
      },
      {
        "type": "p",
        "text": "It sounds simple, and that's exactly where its power is. \"If I go out on a smoke break with colleagues — I bring a glass of water and just stand there.\" \"If I get angry at work — I go downstairs and walk fast to the corner and back for three minutes.\" \"If I'm home alone in the evening — I put the kettle on and text my sister, even about nothing.\" The plan works because in the moment of craving you don't have to invent anything. The answer is already there, like an umbrella by the door."
      },
      {
        "type": "p",
        "text": "Don't try to cover your whole life at once. Take two or three of your most frequent triggers — the ones that come round every day — and write an answer only for those. You'll add the rest along the way, as you spot them."
      },
      {
        "type": "h",
        "text": "If the wave hits anyway"
      },
      {
        "type": "p",
        "text": "Sometimes the plan doesn't hold and the craving arrives at full height. Then remember the main thing we went through in the chapter on withdrawal: a craving moves like a wave. It rises, crests, and falls — on its own, without a cigarette, usually within minutes. You don't have to crush it and you don't have to fight it. It's easier to ride: breathe, give your hands something to do, look out the window, and let the crest pass."
      },
      {
        "type": "p",
        "text": "And the further you go, the kinder the waves get. The first days are the loudest — that's honest. After that they come less often, hold for less time, and hit softer. This is a matter of days and weeks, not an endless marathon. Your body is re-laying the routes; it just needs a little time."
      },
      {
        "type": "p",
        "text": "And if some trigger did catch you out — don't write yourself off. Now you know exactly where the ice is thin, and you can add a plan for it. What to do in the first minutes after a moment like that, we covered nearby — go back to that chapter if you need it."
      },
      {
        "type": "h",
        "text": "Prepare in advance, not mid-explosion"
      },
      {
        "type": "p",
        "text": "The main idea of this whole chapter is simple. A trigger is far easier to handle before it fires than in the second it's tearing at you. You don't have to run yourself into the ground — you can go to bed earlier. You don't have to get ravenous — you can keep nuts or an apple in your bag. You don't have to store up anger all day — you can walk it off instead of smoking it off."
      },
      {
        "type": "p",
        "text": "You're not obliged to get through the hardest moment on willpower alone. If the plans you've written start to feel thin, there are stronger things — things that don't replace your effort, they get under it and take some of the weight. We'll talk about those next, calmly and separately. For now one thing is enough: start seeing your triggers coming, and meet them ready."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Think of the one moment when you most often want to smoke — the most predictable, everyday one. And right now, finish this sentence for it: \"If [that moment] — then I [one concrete action, a couple of minutes long].\" For example: \"If I step out of my building in the morning — then I take three slow breaths and walk to the bus stop.\" One line. That's enough to meet tomorrow's trigger with something in your hands."
      }
    ],
    "takeawayEn": "You don't beat a craving at the crest of the wave — you disarm it the day before, while you're still calm."
  },
  "tools": {
    "titleEn": "If you decide to pick up a tool",
    "leadEn": "Medication isn't a white flag — it's an oven mitt for a hot pan. Let's work out when it belongs in your hand, and when it doesn't.",
    "bodyEn": [
      {
        "type": "p",
        "text": "You already know what a trigger looks like face to face — and what you can do about it without lighting up. Now for an honest conversation a lot of people put off out of pride. About the fact that this path has tools. And that picking one up doesn't mean signing a confession of weakness."
      },
      {
        "type": "h",
        "text": "An oven mitt, not a white flag"
      },
      {
        "type": "p",
        "text": "Picture lifting a scorching pan off the stove. You can do it bare-handed — grit your teeth, wince, get burnt. Or you can grab a mitt. Nobody calls you soft for using a mitt. It's just sensible: less pain, same result."
      },
      {
        "type": "p",
        "text": "Nicotine works the same way. When you stop, your body spends a while confused and sending signals — irritability, craving, the sense that something's missing from your hands and your mouth. The first days are usually the loudest. After that it comes in waves: it rolls in, it lets go, and each time the wave is shorter and quieter. A medication doesn't cancel the process. It just smooths the peaks so you're not making decisions on a hungry, jittery brain."
      },
      {
        "type": "p",
        "text": "Patches, gum, spray — that's nicotine without the smoke and without the hundreds of other things riding along in a cigarette. They gently turn down the background noise while you rebuild your habits. Not a concession for the weaker sort, and not a sign you've given up. It's the oven mitt for the hot pan."
      },
      {
        "type": "h",
        "text": "The tool works alongside you"
      },
      {
        "type": "p",
        "text": "There's a trap here that's easy to fall into. It feels like: swallow a pill and it does the whole job while I sit off to one side. It doesn't go like that. A medication takes away some of the physical noise, but it doesn't teach you how to get through a Friday evening without a cigarette, doesn't sort out your triggers, doesn't answer the question \"so who am I now, without this?\""
      },
      {
        "type": "p",
        "text": "It's like a gym membership. The card in your pocket doesn't grow muscle. But if you go, it opens the door and the work gets easier. Tool and behaviour work together, not instead of each other. The patch damps the craving — and meanwhile you're learning a new way through stress, a new ritual in place of the smoke break, a new version of yourself in the same kitchen."
      },
      {
        "type": "p",
        "text": "One more thing. If you slip along the way — and plenty of people do — the medication has nothing to do with it, and you haven't \"undone everything\" either. One episode simply shows you which trigger turned out to be craftier than you thought. Take it as a hint for next time, not a verdict. The counter in the app understands that and doesn't reset. Stumbling once and getting back up is nothing like going back to the pack."
      },
      {
        "type": "h",
        "text": "A staircase, not one leap"
      },
      {
        "type": "p",
        "text": "Tools come in different strengths, and you can picture them as steps. At the bottom: you and your new habits — breathing, water, a walk, triggers you've mapped out. That's the base, and for many people it's enough."
      },
      {
        "type": "p",
        "text": "Above that come the gentler options — the same patches and gum sitting on the pharmacy shelf without a prescription. Higher still, the more serious ones: cytisine, bupropion, varenicline. They act on the craving mechanism itself from the inside, so they hold your hand more firmly. But a firm grip has a price — each one has its own indications, contraindications and fine print you can't sort out without a professional."
      },
      {
        "type": "p",
        "text": "So, a simple rule: anything prescription-only goes through a doctor. Not through a forum, not through \"it worked for a friend of mine\", not through this app. A doctor looks at the whole of you — your heart, your head, your other medications — and decides which tool fits your hand. And if the first one doesn't suit, they try the next. Finding the right fit isn't always first time, and that's normal."
      },
      {
        "type": "p",
        "text": "But even once a doctor has written the prescription, the author of this programme is you. You decide whether to start with behaviour or take support from the outset. You notice whether it's helping. You and your doctor move up or down the steps together. The tool is in your hand, not the other way round."
      },
      {
        "type": "p",
        "text": "So don't be quick to pin a label on yourself. Not \"I couldn't do it without a pill\" — but \"I chose an easier start.\" That's your programme, put together for you. And who you become while you're putting it together — that's next."
      },
      {
        "type": "p",
        "text": "This is educational text, not medical advice. Any prescription medication — only as prescribed by a doctor."
      }
    ],
    "takeawayEn": "The tool steadies your hand — but you're the one walking. A hammer without a carpenter is just a lump of iron on the floor."
  },
  "identity": {
    "titleEn": "Who you're becoming",
    "leadEn": "Quitting isn't willpower versus cigarettes. It's about who you think you are.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Two people. The first says: \"I'm trying to quit.\" The second: \"I don't smoke.\" On paper, a few words apart. In practice, two different lives."
      },
      {
        "type": "p",
        "text": "\"Trying to quit\" is always about a struggle still going on. The cigarette stays in the frame; it's just forbidden now. You're holding it at arm's length, and the arm gets tired. \"I don't smoke\" isn't about the cigarette at all. It's about you. There's nothing to hold off, because there's nothing there to hold."
      },
      {
        "type": "h",
        "text": "Behaviour follows who you think you are"
      },
      {
        "type": "p",
        "text": "Picture someone you know who doesn't drink on weeknights. Not because of some programme, not because he swore an oath and is now heroically enduring it. He's just that kind of person: it's a working evening, so it's tea. When colleagues call him out for \"just one\" after the Friday meeting, he isn't counting to ten in his head or gripping the edge of the table. He says \"I don't drink on weeknights\" and takes a soda. No strain. Because \"no drinking on weeknights\" isn't a ban he hung on himself. It's just him."
      },
      {
        "type": "p",
        "text": "Cigarettes work the same way. As long as you're \"on a diet from smoking\", every pack in a shop is a test. But once smoking stops being part of you, it stops pulling at you. Not because you're heroic. Because it's not your question anymore. Someone else's cigarettes on the table are like someone else's umbrella in the hallway. It's standing there. So what."
      },
      {
        "type": "p",
        "text": "And here's the important part. You don't wait until you're a non-smoker to start thinking this way. You start thinking this way — and you become one. At first the sentence feels borrowed, like a new jacket with the tag still on. Wear it a week and you stop noticing it's on you."
      },
      {
        "type": "h",
        "text": "You're not at war — you're coming back"
      },
      {
        "type": "p",
        "text": "Sometimes it genuinely helps to meet smoking head on: catch the moment the pull arrives, catch the habit by the wrist. That's a working approach and it knows its place. But as a mood, as the thing you live inside day after day, war wears you out. In a war there's always an enemy across the river, there are trenches, and you're braced: what if they break through. But a cigarette isn't an army. It's a habit you let in yourself once, without knowing what you were signing up for. Standing in trenches against it for years, you'll tire before it does."
      },
      {
        "type": "p",
        "text": "Another picture breathes much easier. There was a you — before the first drag. A curious teenager outside the building, someone who breathed deep and never thought about it. That you didn't go anywhere. He just got buried under ten years of autopilot: hand to the pack, click, drag, without looking. Quitting means clearing away the rubble and getting back to whoever was underneath. You're not building a new person from scratch. You're digging out the real one."
      },
      {
        "type": "p",
        "text": "So this isn't deprivation. You deprive someone by taking away what's theirs. Nothing is being taken from you — the opposite, it's being handed back. The smell of coffee in the morning. Being able to run for a bus without gasping. An evening that doesn't need to be paused for a trip to the stairwell."
      },
      {
        "type": "h",
        "text": "What you know about yourself isn't a verdict"
      },
      {
        "type": "p",
        "text": "In the app you'll see numbers. How much you smoke, which hours pull hardest, what came right before the last cigarette — coffee, a row, boredom, the commute. It's easy to read that as an indictment: look, proof of how deep you're in. But it isn't about shame. It's a map."
      },
      {
        "type": "p",
        "text": "Dependence isn't a character defect or a soft streak. It's how nicotine hooks into the nervous system in everyone alike — professors and truck drivers, no difference. Knowing that your hardest moment is the first cigarette with the morning coffee isn't humiliating. It's useful in exactly the way that knowing you're useless by lunchtime without eight hours of sleep is useful. Data about yourself is leverage, not a brand. The more clearly you see your own mechanism, the less it runs you on the quiet."
      },
      {
        "type": "h",
        "text": "One slip doesn't turn you back"
      },
      {
        "type": "p",
        "text": "Say on day eleven you take a drag. At a friend's wedding, everyone talking over each other, someone holds one out — and you take it. The familiar voice goes up straight away: \"Well, that's it, you've blown it, smoker again, start over.\" That right there is the most dangerous sentence in this chapter."
      },
      {
        "type": "p",
        "text": "One drag doesn't undo who you've become. It shows you the setting that rocks you — and nothing more. The smoker comes back when you decide: \"I slipped, so it was all pointless, who was I kidding.\" Between one cigarette and a pack a day there's a canyon, and who crosses it is up to you, not the cigarette. Which is why eleven days without smoking stay eleven days. Nobody takes them from you — not even you. (More on slips in a chapter of its own; here only one thing matters: a slip doesn't rewrite who you've managed to become.)"
      },
      {
        "type": "p",
        "text": "Someone who stumbled and kept walking and someone who quit without a single slip arrive at the same place. The first one just knows a bit more about himself."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Say one sentence out loud, quietly: \"I don't smoke.\" Not \"I'm quitting\", not \"I'm trying\" — exactly that. Listen to how it lands in your head. If it comes back strange and unfamiliar, that's fine — a new jacket always pulls at the shoulders the first few days. Say it again tomorrow morning. And the morning after."
      }
    ],
    "takeawayEn": "You're not quitting smoking. You're ceasing to be the person who smoked — and it turns out you were under there the whole time."
  },
  "last-cig": {
    "titleEn": "The last cigarette",
    "leadEn": "Why the last cigarette isn't a final battle but a quiet full stop, after which things get easier.",
    "bodyEn": [
      {
        "type": "p",
        "text": "There's an image someone almost certainly handed you in advance. That quitting means stepping into a ring and defending yourself. Teeth clenched, holding on by your fingernails, counting days like a prisoner scratching marks on a cell wall. And somewhere on the horizon an enemy you'll be fighting for years."
      },
      {
        "type": "p",
        "text": "It's a good story. It just isn't true. And more to the point, it gets in your way."
      },
      {
        "type": "h",
        "text": "There's no fight coming"
      },
      {
        "type": "p",
        "text": "Nicotine doesn't behave like a jailer. It behaves like a sticky door that squeaks quietly until you shove it. Every cigarette slightly settles an irritation it created itself a couple of hours earlier. You think you smoke to relax. In fact you're briefly muting a mild discomfort that wouldn't exist at all without the cigarettes."
      },
      {
        "type": "p",
        "text": "So when you quit, no great battle takes place. The squeak just gradually fades. Not instantly — the first days, the door still has a voice. But every day there's less of it, shorter and quieter. This isn't a war measured in years. It's a process measured in days and weeks, and it moves in waves: it rolls in, it lets go, it rolls in weaker, it lets go faster."
      },
      {
        "type": "p",
        "text": "Compare it not to a war but to a tan fading after summer. At first the skin is dark and obvious. Then somehow you stop paying attention. And a couple of weeks later you catch yourself unable to remember what it looked like. Nobody calls that \"a heroic struggle against tanning\". The body just takes its course, and you stay out of the way."
      },
      {
        "type": "h",
        "text": "What the last cigarette actually is"
      },
      {
        "type": "p",
        "text": "If there's no fight, there's no drama around \"the last one\" either. You may have been sold a ritual: smoke it ceremonially, film it maybe, give a farewell speech, crush the stub underfoot as a symbol. There's so much pomp in that it only makes things heavier. The more ceremony, the more important whatever you're saying goodbye to seems. And what you're actually saying goodbye to is a habit that took a little from you for years and gave nothing back."
      },
      {
        "type": "p",
        "text": "The last cigarette isn't a final chord and it isn't a feat. It's a full stop. The one after which the trap starts loosening its fingers. Not \"I did the impossible\" but \"right, I'm done paying this strange tax.\" Imagine you'd been paying for someone else's subscription by mistake for years — charged every month, barely used. And finally you cancelled it. You don't throw a farewell party with flowers over that. You just exhale: about time."
      },
      {
        "type": "p",
        "text": "That's the mood to meet it in. Not \"I'm destroying this\" but \"thanks, I'll take it from here.\" Mild relief instead of strain. If what's inside is a calm \"phew\" rather than heavy solemnity, you've understood it right. It burned down, it went out, fine."
      },
      {
        "type": "h",
        "text": "The first hours on the other side"
      },
      {
        "type": "p",
        "text": "What does it feel like right after? Most likely, a strange silence. The habit used to hand you dozens of small occasions: out the door — smoke, finished the coffee — smoke, nervous before a call — smoke. Now the occasions still arrive, but no action follows. Your hand goes to your pocket and comes back empty. That's not pain. That's unfamiliarity. Like moving the furniture and turning the wrong way for a week when you walk into the room."
      },
      {
        "type": "p",
        "text": "In those hours a wave may roll in — a short, insistent \"I want one\". Don't panic at it and don't inflate it. Like a real wave it has a crest and a fall: it rises, holds thirty seconds at the top, and goes down by itself, usually within a couple of minutes. Wait it out and it's gone. And if at some point you do light up — that's not a collapse and not \"all for nothing\". Treat it as a mark on the map: right here, in this spot, is where it rocked you hardest, and now you know where to put down padding. One misfire doesn't cross out what you've covered, and the counter in the app won't drop back to zero because of it."
      },
      {
        "type": "p",
        "text": "One more thing. If you've decided not to walk this stretch bare-handed — with a patch, gum, or something you chose together with a doctor — there's nothing here to be ashamed of. It isn't a white flag, just a way to turn down the extra noise in your head so you can work on the habit more calmly. That kind of support doesn't do the work for you — it clears the table so the work is easier. You're still steering; there's just less racket in your ear."
      },
      {
        "type": "p",
        "text": "And then the thing this was all for begins: you gradually stop thinking about cigarettes at all. But that's a conversation for the next pages — about who you're becoming, and what life looks like once the door stopped squeaking long ago and you simply forgot about it."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Without getting up, drop your shoulders and let your body go slack for a couple of seconds — like taking off a heavy backpack. You're not lighting anything, not inhaling anything, and inside it goes a little quieter all by itself. Remember that feeling: it's with you now for good, and it doesn't need a pack in your pocket."
      },
      {
        "type": "p",
        "text": "This is educational text and support, not medical advice. Anything you take — patch, gum, prescription — choose and discuss with a doctor."
      }
    ],
    "takeawayEn": "The last cigarette isn't a final battle but the quiet moment the trap finally loosens its fingers. You meet it with an exhale, not a speech."
  },
  "freedom-life": {
    "titleEn": "Life on the other side",
    "leadEn": "Freedom isn't a finish line with a ribbon and a medal. It's a Tuesday you simply live through.",
    "bodyEn": [
      {
        "type": "p",
        "text": "The last cigarette is behind you. You finished it — or you didn't, it doesn't matter. What matters is that the other side, the one you used to think of as distant and heroic, turned out to be just… your ordinary life. No fireworks. And that ordinary life deserves a word of its own, because it's rarely described — which is a shame."
      },
      {
        "type": "h",
        "text": "A morning that no longer starts with a cough"
      },
      {
        "type": "p",
        "text": "The first thing your body used to do in the morning was clear its throat. As if checking everything was still there after the night. You got so used to the sound that you stopped hearing it. For many people it goes away on its own with time: you wake up, and it's quiet. Your chest doesn't drag, there's no familiar lump in your throat that used to feel like part of you. Not for everyone on the same day, not on a schedule — but one day you catch that silence and it surprises you that it's yours."
      },
      {
        "type": "p",
        "text": "And smells. You come in from outside and notice the place smells of morning coffee, not of yesterday's ashtray. You grab your favourite hoodie off the chair and it smells of detergent, not smoke. You kiss your kid before nursery and they don't pull a face. These are small things; you can't post them anywhere. But they're exactly what the new normal is built from."
      },
      {
        "type": "p",
        "text": "And money. Not the abstract \"savings per year\" from a leaflet — something concrete. On a Friday evening there's a bit more in your wallet than usual. You're not tracking it on purpose. You just notice one day that the note which used to quietly turn into smoke every day is still with you."
      },
      {
        "type": "h",
        "text": "You're not tied to the pack anymore"
      },
      {
        "type": "p",
        "text": "Remember this? You leave the house and your hand checks your pocket by itself. Got the pack? How many left? Enough till evening? Is the shop on the way still open? And if you get stuck somewhere you can't step out — then what? A whole invisible logistics operation your head ran a hundred times a day, and you never noticed how much it cost you."
      },
      {
        "type": "p",
        "text": "Now it's gone. You can go out of town for the whole day and never once wonder where the nearest shop is. You can be stuck in an airport through a five-hour delay — and the only thing annoying you is the delay, not the absence of a smoking area. Freedom is partly exactly this: not depending on whether a small box is in your pocket. Not building your day around it."
      },
      {
        "type": "p",
        "text": "And the strangest part is the sense of control. Not the tense kind — \"I'm holding on, I'm strong\" — the calm kind. You drop out of conversations less for that \"sorry, back in a minute\". You stay more often — all of you, right here. A craving can still turn up as an episode months later for some people; that's normal and it doesn't undo how much quieter it's gone inside."
      },
      {
        "type": "h",
        "text": "Quiet gladness instead of endless struggle"
      },
      {
        "type": "p",
        "text": "At first freedom really does feel like a struggle. The first days are the hardest — honestly: it rolls in, it pulls, you want one. Then the waves come less often, get shorter and weaker — day after day, week after week. And at some point you catch yourself noticing there's no struggle left. There's just life, and smoking isn't in it as naturally as chewing on cables isn't in it."
      },
      {
        "type": "p",
        "text": "If a patch, something from your doctor, or anything else helped along the way — that's part of your work, not an asterisk marked \"doesn't count\". The support and your own rewiring were pulling in the same harness. The staircase got you to the floor, but you moved your own feet up the steps."
      },
      {
        "type": "p",
        "text": "And if there was one drag on somebody's balcony — that's a diary entry, not a verdict. Somewhere there was a trigger you didn't spot: stress, company, a drink, boredom. More dangerous than the drag is the thought \"well, here we go again\" — that's what turns one episode into a return. The counter in the app understands that and doesn't drop you to zero. Don't drop yourself to zero either."
      },
      {
        "type": "h",
        "text": "You stop counting days"
      },
      {
        "type": "p",
        "text": "At first you count. Day three, day ten, a month. That's normal and even useful — numbers keep you afloat when it's rough. For some people they stay a support for a long time, and that's fine too. But one day you notice you forgot to look. A week went by and you never once thought about which smoke-free day it was."
      },
      {
        "type": "p",
        "text": "And that's the truest sign you've arrived. Not the number on the screen, but the number no longer being needed. You're not an ex-smoker heroically holding the line. You're just a person living. Smoking has left the list of things you have to think about — off to where the other things live that used to define you and don't anymore."
      },
      {
        "type": "p",
        "text": "There's a road ahead — that's the next chapter. But right now it's worth stopping to notice: you're already here. On the other side. And it turns out the living here is simply good."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Breathe in through your nose — slowly, for a count of four — and catch the smell of whatever is around you this minute: coffee, air from the window, someone's food, the book in your hands. Just note it to yourself: \"I can smell this.\" Smoke used to drown it out. Not anymore."
      },
      {
        "type": "p",
        "text": "This is a chapter from a book — support and experience, not medical advice. Any medication for stopping smoking — only on a doctor's decision."
      }
    ],
    "takeawayEn": "You find out you're free not from the day on the counter — but from the morning you forgot to check it."
  },
  "whats-next": {
    "titleEn": "What's next",
    "leadEn": "You've read it through — and now the interesting part starts, not on these pages but in an ordinary day.",
    "bodyEn": [
      {
        "type": "p",
        "text": "Close the book for a second — in your head. Flick back through everything you've read, and check one feeling: does it still seem to you that a cigarette was giving you something?"
      },
      {
        "type": "p",
        "text": "If it seems that way a little less than it did a week ago, that's enough. You don't have to believe me a hundred per cent. You only have to stop believing the old version of the story, where nicotine was your helper rather than the salesman of a problem it created itself."
      },
      {
        "type": "h",
        "text": "You've seen the trick from the inside"
      },
      {
        "type": "p",
        "text": "You know what changes once someone shows you how the magician palms the coin? The trick is still slick. But it isn't magic anymore. You sit in the audience and see the movement of the elbow you never noticed before."
      },
      {
        "type": "p",
        "text": "Cravings are the same. They used to arrive as a voice from inside: \"have a smoke and it'll pass.\" Now you know whose voice it is. It isn't you wanting a cigarette — it's nicotine leaving your blood, tugging your sleeve and asking for another dose. A small discomfort pretending to be a great need."
      },
      {
        "type": "p",
        "text": "An exposed trick doesn't have to stop appearing. It has to stop running you. And that's where the app comes in — not instead of you, but alongside."
      },
      {
        "type": "h",
        "text": "When the wave comes"
      },
      {
        "type": "p",
        "text": "It will come. Maybe on day two, outside your building, where you stood with a cigarette a hundred times. Maybe at dinner with friends, when someone goes out \"for a smoke\" and calls you along. Maybe at work, on a deadline, when your hands reach for the familiar pause-ritual."
      },
      {
        "type": "p",
        "text": "In that moment you don't have to grit anything out. Open Breeze. There are techniques there for an acute craving — short ones, a minute or two, exactly the length of a wave. Breathing, a couple of questions to ask yourself, something to do with your hands until it drops. Not \"distract yourself and forget\" — a way to walk you through the minute while it passes on its own."
      },
      {
        "type": "p",
        "text": "Log the wave in the craving diary. Where you were, what you felt, how hard it hit. This isn't paperwork. In a week or two you'll see your triggers face to face: \"ah, it's not the morning coffee that gets me, it's the call from my mother\" or \"not the evening — the drive home.\" A trigger with a name is half defused."
      },
      {
        "type": "p",
        "text": "And if you'd rather talk than type — there's the assistant. Not so it can tell you off. So there's someone to say \"I'm shaking, talk to me\" to at three in the morning — and get a normal human answer instead of an empty flat."
      },
      {
        "type": "h",
        "text": "Every wave makes the next one weaker"
      },
      {
        "type": "p",
        "text": "You know all about waves from earlier chapters — I'll add just one thing here. The first always seems enormous simply because you've never lived through it without a cigarette: you have no evidence it falls on its own. Live through it once and the argument is over. From then on you have proof behind you, and every next wave is lower than the last — not as a claim, but from your own experience."
      },
      {
        "type": "p",
        "text": "One day you catch yourself unable to remember when it last rolled in. This is a story about days and weeks, not one heroic evening. The day-by-day path in Breeze is exactly about that: not \"hold on\" but \"look how far you've come.\""
      },
      {
        "type": "p",
        "text": "And if one day you slip — one drag, one cigarette on nerves — don't believe the voice that instantly announces: \"that's it, failed, back to zero.\" That's the same salesman as before, just coming at you from another angle: blowing one misfire up into a catastrophe so you'll give up and come back. Don't hand him that. The counters in Breeze don't reset over a single stumble, and don't you write yourself off either. A stumble is a stumble, not a fall back into being a smoker."
      },
      {
        "type": "p",
        "text": "And one more thing, briefly but importantly. If you decide to bring in support — a patch, gum, something on prescription — that's not a white flag and not a betrayal of everything you've read here. It's like turning down the background hum so you can hear those waves more clearly in the quiet and wait them out more calmly. Things like that help alongside understanding, not in place of it. Only one rule: anything prescription-only goes through a doctor — this isn't a place to guess."
      },
      {
        "type": "h",
        "text": "A long exhale"
      },
      {
        "type": "p",
        "text": "You're not giving up something good. You're taking back what was yours all along: a smooth morning without the tickle in your throat, the smell of your own skin, the money that used to smoulder away eight centimetres at a time, and a quiet pride you can't buy."
      },
      {
        "type": "p",
        "text": "What starts now is the simple, ordinary life of someone who doesn't smoke — with its own small details you've yet to get used to. And right now, do the one thing this app and this book are named for."
      },
      {
        "type": "p",
        "text": "Take a long, slow exhale. Longer than the breath in. Feel your shoulders drop. The air leaves you freely, all of it — for the first time in a long while nothing is in its way. There. That's the beginning."
      },
      {
        "type": "p",
        "text": "And the last thing, which can't be left out: all of this is a book that walks beside you and supports you, not medical advice. Anything to do with your health and medication, decide together with a doctor."
      },
      {
        "type": "h",
        "text": "Try this right now"
      },
      {
        "type": "p",
        "text": "Open Breeze and set your start date — today's. Just mark today as day one. Thirty seconds, one tap — and your path has a point to count from, the point every wave you live through will be measured against."
      }
    ],
    "takeawayEn": "A craving doesn't need to be beaten — it needs to be lived through once, and it'll tell the next one there's nothing on offer here anymore."
  }
};
