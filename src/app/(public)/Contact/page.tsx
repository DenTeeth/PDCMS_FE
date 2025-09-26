import Navigation from "@/components/layout/Navigation";
import DynamicBreadcrumb from "@/components/ui/DynamicBreadcrumb";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-r from-accent to-secondary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DynamicBreadcrumb />
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Contact</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Contact us to book an appointment, ask about our services, or get advice.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact information</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-700 space-y-3">
                <p><span className="font-medium">Address:</span> FPT University, District 9, HCMC</p>
                <p><span className="font-medium">Phone:</span> 01234 5678</p>
                <p><span className="font-medium">Email:</span> contact@denteeth.com</p>
                <p><span className="font-medium">Working hours:</span> 08:00 - 21:00 (Mon - Sun)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200">
                  <iframe
                    title="FPT University Map"
                    src="https://www.google.com/maps?q=FPT%20University%20HCMC&output=embed"
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-1">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" name="name" placeholder="John Doe" className="mt-2" />
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input id="phone" name="phone" placeholder="0901 234 567" className="mt-2" />
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" className="mt-2" />
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" placeholder="Service consultation" className="mt-2" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Describe your needs..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" className="w-full sm:w-auto">Send request</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}


