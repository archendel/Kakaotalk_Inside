import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin 초기화 (한 번만 실행되도록)
const app = initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { postId, password } = req.body;

  // 🔑 관리자 비밀번호 확인
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, error: "Invalid password" });
  }

  try {
    // 댓글 삭제
    const comments = await db.collection("posts").doc(postId).collection("comments").get();
    for (const c of comments.docs) {
      await c.ref.delete();
    }

    // 글 삭제
    await db.collection("posts").doc(postId).delete();

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
