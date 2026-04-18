import { AssetStatusEmail } from "../AssetStatusEmail";

export default function AssetStatusEmailPreview() {
  return (
    <AssetStatusEmail
      status="approved"
      actorName="Maya Patel"
      assetName="Homepage Hero Concept.png"
      projectName="Acme Website Redesign"
      actionUrl="http://localhost:3000/projects/123"
      bodyHtml="The client approved this file. You can proceed to final delivery."
    />
  );
}

export function ChangesRequestedPreview() {
  return (
    <AssetStatusEmail
      status="changes_requested"
      actorName="Maya Patel"
      assetName="Homepage Hero Concept.png"
      projectName="Acme Website Redesign"
      actionUrl="http://localhost:3000/projects/123"
      bodyHtml="The client requested updates to typography and spacing."
    />
  );
}
