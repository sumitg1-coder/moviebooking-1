Atleast read the last few lines,

This movie backend course project is submitted by - Manjit Dutta, everything seems to be working, I have attached screenshots of each working functionality as a proof, forgive me for any mistakes that I might have made in the making of this project as I am just a beginner in backend development, or software development as a whole, I had some troubles with the controller functionalities but in the end I was able to get them to work somehow, Oh yeah there is one issue with the routing to previous components in details page, like when going back from Summary/confirm component to BookShow component the data fields in the frontend disspears and api calls returns error, but it's fine if you don't go to confirm component and go back from BookShow component to movie details component, and another one is the double api calls or logs in console because of react strictmode in index.js file which doesn't matter in dev environment I guess, and the missing logo which can be fixed by removing the icon section in the manifest.json file in the public folder, the frontend is mostly acting asynchronus, also sometimes the backend data is expected to be sent after wrapping it in object and sometimes as plain array, Also sometimes frontend is not sending all the necessary fields to be stored in database, anyways didn't made a single modification to frontend and focussed only on backend only fix, otherwise the backend could've been improved by atleast ten folds, nah just kidding, but yes it could've been improved alot as the frontend is old by 4 years. And, lastly the coupon code integration was never clear in the instruction checkpoint guides - so I didn't know what to or how to make use of it in the project, one more thing is that there are some naming inconsistencies between what backend data has or was provided as a dummy data in the checkpoint and what frontend is expecting like critic_rating vs critics_rating and story_line vs storyline, well anyways that's all for now I guess if I hadn't forgotten to mention anything else.

Later Findings:
Since show_id is not being sent from frontend we don't have a way to get the exact show, and because we don't  have a field to exactly match which show it is we don't have a way to put it in the database, I mean we could fetch it from the movie/id api endpoint but still we are not going to have any matching parameter to compare to get the exact show_id, also the frontend is sending total number of tickets booked instead of individual ticket numbers like if you booked these seats 21, 22, 46, 50, etc. Then it's send tickets: ['4'];

Frontend is only sending these params when making booking request, console log or you can also see it in network tab while making the booking request...

Incoming request: POST /api/auth/bookings
Query Params: {}
Body: {
  customerUuid: '227c1741-b162-4353-a6be-0ecbc1f86869',
  bookingRequest: { coupon_code: '11', tickets: [ '4' ] }
}

Also coupon code api gives error in case coupon code already exist for that show, because we don't have the exact show_id or seat numbers we can't determine if we want to apply the coupons again, otherwise you could apply unlimited number of coupouns and in real life scenario that can make ticket prices drop to zero, so yes like I said there's no clear guideline on how to implement and make use of coupons, I am just going to let it be the way it is right now.

As for dummy data for my db, I had just copy pasted the data provided in the checkpoint.

Important!!!
PS:- For username, while login in after registering new account, the username would be 'firstName' + '_' + 'lastName', so it would be 'firstName_lastName', if 'Donald'+'Trump' will be 'Donald_Trump'.