// api/deletePost.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Vercel 환경변수에서 서비스 계정 키 불러오기
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// 이미 초기화된 경우 또 초기화하지 않도록 체크
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { postId, password } = req.body;

  // 🔑 관리자 비밀번호 검증
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, error: "Invalid password" });
  }

  try {
    // 댓글 먼저 삭제
    const commentsSnap = await db.collection("posts").doc(postId).collection("comments").get();
    for (const c of commentsSnap.docs) {
      await c.ref.delete();
    }

    // 글 삭제
    await db.collection("posts").doc(postId).delete();

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
