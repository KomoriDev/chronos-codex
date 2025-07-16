"use client"

import { useEffect, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tables } from "@/types/database"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"

type Profile = Tables<"users">

export default function AccountPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<Profile>()

  const supabase = createClient()

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", String(id))
        .single()

      if (error) throw error
      if (profile) {
        setProfile(profile)
      }
    } catch (error) {
      toast.error("Failed to get user information", {
        description: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  async function updateProfile(event?: React.FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault()
    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          username: profile?.username,
          email: profile?.email,
          avatar_url: profile?.avatar_url,
        })
        .eq("auth_id", String(id))

      if (updateError) throw updateError

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_url: profile?.avatar_url,
          username: profile?.username,
          email: profile?.email,
        },
      })

      if (authError) throw authError

      toast.success("Update successfully", {
        description: "Personal information has been updated",
      })
    } catch (error) {
      toast.error("Update failed", {
        description: (error as Error).message,
      })
    }
  }

  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    setUploading(true)

    if (!files || files.length === 0) {
      toast.error("Please select a image to upload")
      setUploading(false)
      return
    }

    try {
      const fileName = `${id}/avatar.${files[0].name.split(".").pop()}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, files[0], {
          upsert: true,
          cacheControl: "0",
        })

      if (uploadError) {
        toast.error("Image upload failed", {
          description: uploadError.message,
        })
      } else {
        const { data: avatar } = supabase.storage.from("avatars").getPublicUrl(fileName, {
          download: false,
          transform: {
            quality: 75,
          },
        })

        const newAvatarUrl = avatar.publicUrl

        const { error: updateError } = await supabase
          .from("users")
          .update({
            avatar_url: newAvatarUrl,
          })
          .eq("auth_id", String(id))

        if (updateError) throw updateError

        const { error: authError } = await supabase.auth.updateUser({
          data: {
            avatar_url: newAvatarUrl,
            username: profile?.username,
            email: profile?.email,
          },
        })

        if (authError) throw authError

        if (profile) {
          setProfile({ ...profile, avatar_url: newAvatarUrl })
        }

        toast.success("Avatar updated successfully", {
          description: "Profile has been updated with the new avatar",
        })
      }
    } catch (error) {
      toast.error("An error occurred while uploading the image", {
        description: (error as Error).message,
      })
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    getProfile()
  }, [id, getProfile])

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar
                className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => document.getElementById("avatar")?.click()}
              >
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || "Visitor"} />
                <AvatarFallback className="rounded-lg">
                  {uploading ? "..." : profile?.username?.[0]?.toUpperCase() || "User"}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={uploadImage}
                className="hidden"
                disabled={uploading}
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold">{profile?.username || "未设置用户名"}</h2>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <form onSubmit={updateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={profile?.username || ""}
                onChange={(e) => {
                  if (profile) {
                    setProfile({
                      ...profile,
                      username: e.target.value,
                    })
                  }
                }}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                onChange={(e) => {
                  if (profile) {
                    setProfile({
                      ...profile,
                      email: e.target.value,
                    })
                  }
                }}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Save"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
