"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, ArrowRightLeft, Eye, FlaskConical, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CrmSchemaEditor } from "@/components/crm-mapping/CrmSchemaEditor";
import { CrmFieldMapper } from "@/components/crm-mapping/CrmFieldMapper";
import { CrmMappingPreview } from "@/components/crm-mapping/CrmMappingPreview";
import { CrmTestExportPanel } from "@/components/crm-mapping/CrmTestExportPanel";

export default function CrmMappingPage() {
  const [activeTab, setActiveTab] = useState("schema");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Custom CRM Mapping</h1>
          <p className="text-sm text-muted-foreground">Define your CRM tables, map SDR fields, and test exports</p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schema" className="gap-2 text-xs sm:text-sm"><Database className="h-4 w-4" /><span className="hidden sm:inline">Schema</span></TabsTrigger>
          <TabsTrigger value="mapping" className="gap-2 text-xs sm:text-sm"><ArrowRightLeft className="h-4 w-4" /><span className="hidden sm:inline">Mapping</span></TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 text-xs sm:text-sm"><Eye className="h-4 w-4" /><span className="hidden sm:inline">Preview</span></TabsTrigger>
          <TabsTrigger value="test" className="gap-2 text-xs sm:text-sm"><FlaskConical className="h-4 w-4" /><span className="hidden sm:inline">Test Export</span></TabsTrigger>
        </TabsList>
        <TabsContent value="schema"><CrmSchemaEditor onComplete={() => setActiveTab("mapping")} /></TabsContent>
        <TabsContent value="mapping"><CrmFieldMapper onComplete={() => setActiveTab("preview")} /></TabsContent>
        <TabsContent value="preview"><CrmMappingPreview /></TabsContent>
        <TabsContent value="test"><CrmTestExportPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
