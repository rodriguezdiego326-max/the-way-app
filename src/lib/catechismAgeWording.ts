import type { AgeRange } from './familyTypes';

export interface CatechismAgeWording {
  question: string;
  short_answer: string;
}

export type CatechismAgeKey = Exclude<AgeRange, '18+'>;

// SOLAPATH's own age-level phrasing. Never presented as the historic text.
// Adults (18+) are shown the original catechism wording unchanged.
export const catechismAgeWording: Record<string, Record<CatechismAgeKey, CatechismAgeWording>> = {
  'westminster-1': {
    '3-5': { question: 'Why did God make us?', short_answer: 'To know Him, love Him, and live for His glory.' },
    '6-8': { question: 'What is the most important purpose God gave us?', short_answer: 'To glorify God, which means showing how wonderful He is, and to enjoy Him forever.' },
    '9-12': { question: 'What is our greatest purpose in life?', short_answer: 'To glorify God and enjoy Him forever.' },
    '13-15': { question: 'What is the highest end of human life, and why does it matter?', short_answer: 'To glorify God and enjoy Him forever. Our purpose is found in God Himself, not in success or approval.' },
    '16-17': { question: 'How do glorifying God and finding joy in Him fit together?', short_answer: 'We glorify God most fully when we enjoy Him, and our deepest joy is found in honoring Him.' },
  },
  'westminster-2': {
    '3-5': { question: 'What helps us know how to love God?', short_answer: 'The Bible. God\'s Word tells us how to love and glorify Him.' },
    '6-8': { question: 'What book did God give us to show us how to live for Him?', short_answer: 'The Bible, God\'s Word. It is the one rule we can trust to know how to glorify and enjoy Him.' },
    '9-12': { question: 'What is the only rule God gave us for glorifying and enjoying Him?', short_answer: 'The Word of God in the Old and New Testaments, the Bible.' },
    '13-15': { question: 'What is the only rule God has given for how we glorify and enjoy Him?', short_answer: 'Scripture, the Old and New Testaments. Every other standard is measured by it.' },
    '16-17': { question: 'Where does God\'s authority for faith and life come from?', short_answer: 'From Scripture alone, the Word of God in the Old and New Testaments.' },
  },
  'westminster-3': {
    '3-5': { question: 'What does the Bible teach us?', short_answer: 'What to believe about God and how He wants us to live.' },
    '6-8': { question: 'What are the two big things the Bible teaches?', short_answer: 'What is true about God, and what God asks us to do.' },
    '9-12': { question: 'What does the Bible mainly teach?', short_answer: 'What we should believe about God, and what God asks of us.' },
    '13-15': { question: 'What is the main teaching of Scripture?', short_answer: 'The truth about who God is, and the call to respond to Him in obedience.' },
    '16-17': { question: 'How do belief and obedience relate in Scripture\'s teaching?', short_answer: 'Scripture teaches what to believe about God and what He requires of us. The two are never meant to be separated.' },
  },
  'westminster-4': {
    '3-5': { question: 'What is God like?', short_answer: 'God is a Spirit. He is always good, always true, and always with us.' },
    '6-8': { question: 'What is God like?', short_answer: 'God is a Spirit with no beginning or end. He never changes, and everything about Him is perfect.' },
    '9-12': { question: 'What is God like?', short_answer: 'God is an infinite, eternal Spirit who never changes. His wisdom, power, holiness, justice, goodness, and truth are perfect.' },
    '13-15': { question: 'How does the catechism describe God\'s being and character?', short_answer: 'God is a Spirit, infinite, eternal, and unchangeable. His wisdom, power, holiness, justice, goodness, and truth are all perfect.' },
    '16-17': { question: 'What does it mean that God is unchangeable in His perfections?', short_answer: 'God\'s perfections never change, so His promises can be trusted completely.' },
  },
  'westminster-5': {
    '3-5': { question: 'Is there more than one God?', short_answer: 'No. There is only one God, and He is living and true.' },
    '6-8': { question: 'How many Gods are there?', short_answer: 'There is only one God. He alone is living and true.' },
    '9-12': { question: 'Is there more than one God?', short_answer: 'There is only one true and living God. We worship Him alone.' },
    '13-15': { question: 'Which gods compete for our loyalty, and which God is truly God?', short_answer: 'There is one living and true God. Anything we put in His place is not God.' },
    '16-17': { question: 'What does the oneness of God require of our loyalty?', short_answer: 'God is the only true God, so every rival claim on our worship must be refused.' },
  },
  'westminster-6': {
    '3-5': { question: 'How many persons are in God?', short_answer: 'Three: the Father, the Son, and the Holy Spirit, and yet one God.' },
    '6-8': { question: 'How many persons are in the one God?', short_answer: 'Three persons: the Father, the Son, and the Holy Spirit. They are one God, equal in power and glory.' },
    '9-12': { question: 'Who are the three persons of the one God?', short_answer: 'The Father, the Son, and the Holy Spirit. They are one God, equal in power and glory.' },
    '13-15': { question: 'How can God be three persons and still one God?', short_answer: 'The Father, Son, and Holy Spirit are three persons who are one God, equal in power and glory. We receive this mystery in worship.' },
    '16-17': { question: 'How does the doctrine of the Trinity hold distinction and unity together?', short_answer: 'Three persons who share one divine substance, equal in glory and power.' },
  },
  'westminster-7': {
    '3-5': { question: 'Does God have a plan?', short_answer: 'Yes. God planned everything that happens, and nothing surprises Him.' },
    '6-8': { question: 'What did God plan?', short_answer: 'God planned everything that will happen, for His own glory.' },
    '9-12': { question: 'Did God plan what happens in the world?', short_answer: 'Yes. God has an eternal purpose for all things, for His glory and His people\'s good.' },
    '13-15': { question: 'What does it mean that God has an eternal plan for everything?', short_answer: 'God\'s decrees are His eternal plan, made by His wise will. Nothing is random, and nothing escapes His purpose.' },
    '16-17': { question: 'How can God\'s eternal plan be a comfort rather than fatalism?', short_answer: 'God\'s decree is wise, rooted in His own counsel, and for His glory, so His people can rest in it.' },
  },
  'westminster-8': {
    '3-5': { question: 'How does God take care of His plan?', short_answer: 'He made the world, and He takes care of everything in it.' },
    '6-8': { question: 'How does God carry out His plan?', short_answer: 'By creating everything and by keeping everything going every day.' },
    '9-12': { question: 'How does God carry out His decrees?', short_answer: 'Through creation, when He made the world, and through providence, when He cares for and governs all He made.' },
    '13-15': { question: 'What are the two ways God carries out His decrees?', short_answer: 'Creation, when He made the world, and providence, His ongoing governing of every detail.' },
    '16-17': { question: 'What is providence, and how does God carry out His decree through it?', short_answer: 'Providence is God\'s ongoing sustaining and directing of all things. Through it He carries out His eternal plan.' },
  },
  'westminster-9': {
    '3-5': { question: 'How did God make everything?', short_answer: 'He made everything out of nothing by His word, in six days, and it was all very good.' },
    '6-8': { question: 'How did God make the world?', short_answer: 'He made everything from nothing, just by speaking, in six days, and it was all very good.' },
    '9-12': { question: 'How long did it take God to make everything?', short_answer: 'Six days. God made all things out of nothing by the power of His word, and all of it was very good.' },
    '13-15': { question: 'What does Genesis teach about how the world began?', short_answer: 'God made everything out of nothing by His powerful word in six days, and declared it all very good.' },
    '16-17': { question: 'Why does it matter that creation came from God\'s word alone?', short_answer: 'Creation came from God\'s word alone, out of nothing, and its goodness answers any view that the material world is evil.' },
  },
  'heidelberg-1': {
    '3-5': { question: 'What is our only comfort in life and in death?', short_answer: 'That we belong to Jesus, who is faithful and holds us in life and in death.' },
    '6-8': { question: 'What is our greatest comfort in life and in death?', short_answer: 'That we belong to Jesus, body and soul. He is our faithful Savior.' },
    '9-12': { question: 'What is our greatest comfort, in life and in death?', short_answer: 'That we belong to Jesus, body and soul, and He never lets us go.' },
    '13-15': { question: 'What comfort holds when life falls apart?', short_answer: 'That we belong to Jesus Christ, who owns us, saves us, and keeps us whether we live or die.' },
    '16-17': { question: 'What comfort holds in life and in death?', short_answer: 'Belonging to Christ, body and soul. This comfort rests in our union with Him, not in our circumstances.' },
  },
  'heidelberg-2': {
    '3-5': { question: 'What do we need to know to be happy with Jesus?', short_answer: 'That we have sinned, that Jesus rescues us from sin, and that we should thank God.' },
    '6-8': { question: 'What three things do we need to know?', short_answer: 'How big our sin is, how Jesus rescues us from it, and how to thank God for rescuing us.' },
    '9-12': { question: 'What three things help us live in the comfort of Jesus?', short_answer: 'Knowing how serious our sin is, how Jesus delivers us, and thanking God for it.' },
    '13-15': { question: 'What three things do we need to know to live in joy in Christ?', short_answer: 'Honesty about our sin and misery, the good news of deliverance in Christ, and a grateful response.' },
    '16-17': { question: 'How does the catechism move from our need to God\'s rescue?', short_answer: 'From our misery to deliverance in Christ, and from deliverance to gratitude that shapes how we obey.' },
  },
};
