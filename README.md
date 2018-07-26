
Page Link: https://www.facebook.com/RideWidth
## Inspiration
Office commute is a an issue large number of citizens face in Pakistan’s beautiful capital islamabad. With really low coverage of good quality public transport people have to use normal small size vans which are also used for cargo for home-work-home commute. Though there are ride sharing apps on offering like careem and uber but still they are not economical enough for large swaths of population to use. 

The people who know each other closely or from same office try to group together in uber rides but there are still many who has to suffer through poor quality public transportation. Conditions become even more difficult in severe summer, winter or rain where shortage of public transportation becomes more acute.

Even that public transportation rely on fixed pick and drop points. So why we can not use the same model for ride sharing.

Additional issue was that all those commuting on public transport or on their own cars with most often one person per car are stuck on roads in a congested environment.

So how can we save the daily commuters from hassles of public transport at the same time easing load on road infrastructure.

For those who use their own conveyance with increasing fuel prices along with increasing dollar prices commuting is become expensive. If there is some way they can maintain their daily commute all the while making it less expensive for them will be like killing two birds with one stone.

## What it does
Those who commute between almost same start and end points can form a community built around their way points, route of travel and timings. It will help people in
Saving commuting cost for passengers
Getting a much more improved riding experience.
Reducing traffic load on the roads.
Strengthening communities through building new relationships
Giving Shared experiences.



## How we built it
The solution is built around facebook login, messenger and payments api. The idea is that those who commute daily e.g. between points a to b and back again on set timings and have capacity to share in their rides can register with the app with their points of departure and arrival. Other commuters who use the same route can browse list of registered drivers and then select the one who is closes to his route. 
The whole idea is build around messenger. There is no specific interface instead messenger bot is built using wit.ai integrated with firebase. 

User talks in messenger whether he wants to share or get a ride then the whole workflow goes on from there as demonstrated in the video

## Challenges we ran into
How to share user profile as we want the experience to be as much user centric as possible, due to limitation of time and team being full time employed we took profile link but we plan to look into graph api to work some referring mechanics
Create trust and the solution was facebook logins
Javascript code to tie chatbot to real time db
Reading and parsing location

## Accomplishments that we're proud of
Identifying a real civic issue and providing a solution which fits the local culture and values. Can be easily worked in to a final end product to help large number of people on daily basis. Not just a product but a tool that will bring people together and strengthen communities. As people belonging to same area and using same route will be able to meet and greet each other

## What we learned
Developing and deploying messenger chatbot.
Facebook graph api authentication and permission mechanisms
NLP with wit.ai
Real time db operation with javascript using chatbot
Location parsing

## What's next for Car dost
We will turn it into a useable app. Start with limited alpha inviting friends and family. Get their feedback, implement them and if all goes well release it to a wider audience

