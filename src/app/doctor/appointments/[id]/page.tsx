import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import ConsultationForm from "@/components/doctor/ConsultationForm";

export default async function DoctorAppointmentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user?.id) return <div className="p-4">Unauthorized</div>;
  if (session.user.role !== "DOCTOR") return <div className="p-4">Forbidden</div>;

  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });
  if (!doctorProfile) return <div className="p-4">Doctor profile not found</div>;

  const appointment = await prisma.appointment.findUnique({ where: { id: params.id }, include: { slot: true, patient: true, symptomForm: true, visitNote: true } });
  if (!appointment) return <div className="p-4">Appointment not found</div>;
  if (appointment.doctorProfileId !== doctorProfile.id) return <div className="p-4">Forbidden</div>;

  const sf = appointment.symptomForm;
  const urgency = sf?.urgency ?? null;
  const urgencySignals = Array.isArray(sf?.urgencySignals) ? (sf!.urgencySignals as unknown as string[]) : (sf?.urgencySignals ? JSON.parse(String(sf!.urgencySignals)) : null);
  const suggestedQuestions = Array.isArray(sf?.suggestedQuestions) ? (sf!.suggestedQuestions as unknown as string[]) : (sf?.suggestedQuestions ? JSON.parse(String(sf!.suggestedQuestions)) : null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
            <h1 className="text-2xl font-semibold">Pre-visit brief</h1>
            <div className="text-sm text-slate-500">{appointment.patient?.name ?? 'Patient'}</div>
            {appointment.patient?.phone && <div className="text-sm text-slate-500">{appointment.patient.phone}</div>}
        </div>
        <div>
          <div className="text-sm text-slate-500">{appointment.slot?.startTime.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">Chief complaint</div>
                <div className="font-medium mt-1">{sf?.chiefComplaint ?? '—'}</div>
              </div>
              <div>
                <Badge variant={urgency ? (urgency === 'HIGH' ? 'high' : urgency === 'MEDIUM' ? 'medium' : 'low') : undefined}>{urgency ? urgency : 'No urgency'}</Badge>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-slate-500">Raw symptoms</div>
              <div className="mt-2 text-sm whitespace-pre-wrap">{sf?.rawSymptoms ?? 'No symptoms provided.'}</div>
            </div>
          </Card>

          {sf && sf.changesSinceLastVisit !== null && sf.changesSinceLastVisit !== undefined && (
            <Card>
              <div className="flex items-start gap-3">
                <div className="text-xl">🕘</div>
                <div>
                  <div className="text-sm font-medium">Continuity — changes since last visit</div>
                  <div className="mt-2 text-sm">{sf.changesSinceLastVisit}</div>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <div className="text-sm font-medium">Suggested questions</div>
            <div className="mt-2 space-y-2">
              {(suggestedQuestions && suggestedQuestions.length) ? (
                suggestedQuestions.map((q: string, i: number) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="checkbox" aria-label={`question-${i}`} />
                    <span className="text-sm">{q}</span>
                  </label>
                ))
              ) : (
                <div className="text-sm text-slate-500">No suggested questions.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="text-sm font-medium">AI-generated — clinical judgment required</div>
            <div className="mt-3">
              <div className="text-sm font-medium">Why this urgency</div>
              {urgencySignals && urgencySignals.length ? (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {urgencySignals.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              ) : (
                <div className="text-sm text-slate-500 mt-2">No explainability signals available.</div>
              )}
            </div>
            {sf?.llmError && <div className="mt-3 text-sm text-rose-600">AI summary unavailable — review symptoms below</div>}
          </Card>

          <Card>
            <div className="text-sm font-medium">Actions</div>
            <div className="mt-3">
              <ConsultationForm appointmentId={appointment.id} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
