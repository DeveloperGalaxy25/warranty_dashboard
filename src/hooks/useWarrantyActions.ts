// src/hooks/useWarrantyActions.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WarrantyRecord } from "@/hooks/useWarrantyData";

// create a workflow log entry alongside updates
async function logWorkflow(warrantyId: string, patch: Partial<WarrantyRecord>, who?: string) {
  await addDoc(collection(db, "workflow_logs"), {
    warrantyDocId: warrantyId,
    patch,
    updatedBy: who ?? "Dashboard",
    updatedAt: serverTimestamp(),
  });
}

// update selected fields on an existing warranty doc
export async function updateWarrantyStatus(
  docId: string,
  patch: Partial<WarrantyRecord>,
  who?: string
) {
  const ref = doc(db, "warranties", docId);
  await updateDoc(ref, {
    ...patch,
    LastUpdatedOn: serverTimestamp(),
  });
  await logWorkflow(docId, patch, who);
}

// add a brand-new warranty record (optional convenience)
export async function addWarranty(record: Omit<WarrantyRecord, "id">) {
  const ref = await addDoc(collection(db, "warranties"), {
    ...record,
    Timestamp: record.Timestamp || serverTimestamp(),
    LastUpdatedOn: serverTimestamp(),
  });
  await logWorkflow(ref.id, { Status: record.Status || "New" }, "Dashboard");
  return ref.id;
}

// soft delete vs hard delete — pick your approach
export async function deleteWarranty(docId: string) {
  await deleteDoc(doc(db, "warranties", docId));
  await logWorkflow(docId, { Status: "Deleted" }, "Dashboard");
}
