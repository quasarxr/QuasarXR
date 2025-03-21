"use client"
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function GoogleDriveUploader( { folderId, accessToken }: { folderId: string; accessToken: string } ) {
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [fileName, setFileName] = useState(""); // 사용자 입력 파일명

    const handleUpload = async (file: File) => {
        if (!folderId) {
            alert("먼저 Google Drive 폴더를 선택하세요.");
            return;
        }

        setUploading(true);
        setUploadSuccess(false);

        const metadata = {
            name: fileName || file.name, // 입력한 파일명이 있으면 사용
            parents: [folderId], // 🔥 선택한 폴더 ID에 저장
            mimeType: file.type,
        };

        const formData = new FormData();
        formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        formData.append("file", file);

        try {
            const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                setUploadSuccess(true);
                console.log("파일 업로드 성공:", result);
            } else {
                console.error("업로드 실패:", result);
            }
        } catch (error) {
            console.error("업로드 중 오류 발생:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="파일명을 입력하세요 (예: model.glb)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
            />
            <input
                type="file"
                accept=".glb"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleUpload(e.target.files[0]);
                    }
                }}
                disabled={uploading}
            />
            {uploading && <p>업로드 중...</p>}
            {uploadSuccess && <p>✅ 업로드 성공!</p>}
        </div>
    );
}