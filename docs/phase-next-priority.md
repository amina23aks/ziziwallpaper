# Next priority phase implementation notes

## Role behavior matrix

| Role | Browse public wallpapers/questions/categories | Favorite wallpapers | Comment / reply | Edit or delete own feedback | Manage wallpapers/categories/questions | Moderate any feedback | Upload to Cloudinary admin route |
| --- | --- | --- | --- | --- | --- | --- | --- |
| guest | Yes, published content only | No | No | No | No | No | No |
| user | Yes, published content only | Yes | Yes | Yes | No | No | No |
| admin | Yes, including admin-managed flows | Yes | Yes | Yes | Yes | Yes | Yes |

## Firestore rules draft intent

The draft in `firestore.rules.draft` keeps reads public only for safe collections and published wallpapers, keeps user-owned writes limited to the authenticated owner, and keeps admin-managed collections locked to admins. Comments are readable only when attached to a published wallpaper, while favorites remain private per user. Cloudinary uploads are expected to pass through the protected admin-only Next.js route. See `firestore.rules.draft` for the concrete rules text.

## Manual platform steps

1. Add Firebase Admin SDK environment variables to Vercel: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
2. Keep the existing public Firebase web config values for the client app.
3. Confirm the Cloudinary env vars exist in Vercel: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
4. Deploy the Firestore rules from `firestore.rules.draft` after reviewing them against production data.
5. Make sure every admin account has a matching Firestore user document with `role: "admin"`.
6. Backfill old wallpapers so `questionId` is the canonical link, while `questionIds` and `questionPromptSlugs` can remain as compatibility fields during rollout.

## Manual test checklist

1. Guest can load home, question result pages, and published wallpaper pages, but cannot favorite or comment.
2. Guest cannot access `/admin`, and the upload route rejects unauthenticated requests.
3. Signed-in user can favorite/unfavorite without page reload and sees favorites page populated correctly.
4. Favorites page should not show unpublished wallpapers.
5. Signed-in user can create, edit, reply to, and delete only their own comments.
6. Signed-in non-admin user cannot delete another user's comment.
7. Admin can open `/admin`, upload images, create/edit wallpapers, categories, and questions.
8. Admin can delete any comment or reply from a wallpaper page.
9. Question result pages should still show wallpapers linked through legacy fields and new canonical `questionId` data.
10. Signing in repeatedly should not spam user profile writes when nothing changed.
