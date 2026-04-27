import { FileTable } from "@/components/files/file-table";
import { FileUploadForm } from "@/components/files/file-upload-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listFiles } from "@/lib/db/files";
import { listProperties } from "@/lib/db/properties";

export default async function FilesPage() {
  const context = await requireSession("files:view");
  const [files, properties] = await Promise.all([listFiles(context), listProperties(context)]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Files"
        description="Upload, review, and distribute secure property files with signed access."
      />
      {context.company && context.can("files:upload") ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload file</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploadForm companyId={context.company.id} properties={properties} />
          </CardContent>
        </Card>
      ) : null}
      <FileTable
        canDeleteAny={context.can("files:delete")}
        companyId={context.company?.id ?? null}
        currentUserId={context.profile.id}
        files={files}
        realtimeScope={
          context.profile.role === "super_admin" || context.profile.role === "corporate_user"
            ? "company"
            : "user"
        }
      />
    </div>
  );
}
