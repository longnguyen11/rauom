"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { TemporaryMenuDish } from "@/lib/menu";

interface TemporaryDishForm {
  slot: 1 | 2;
  isActive: boolean;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  priceEn: string;
  priceVi: string;
  deliveryDate: string;
  orderDeadline: string;
  imageUrl: string;
  imageAltEn: string;
  imageAltVi: string;
}

interface MenuSettingsFormProps {
  initialDishes: TemporaryMenuDish[];
}

function toFormDish(dish: TemporaryMenuDish): TemporaryDishForm {
  return {
    slot: dish.slot,
    isActive: dish.isActive,
    nameEn: dish.copy.en.name,
    nameVi: dish.copy.vi.name,
    descriptionEn: dish.copy.en.description,
    descriptionVi: dish.copy.vi.description,
    priceEn: dish.copy.en.price,
    priceVi: dish.copy.vi.price,
    deliveryDate: dish.deliveryDate,
    orderDeadline: dish.orderDeadline,
    imageUrl: dish.imageUrl,
    imageAltEn: dish.copy.en.imageAlt,
    imageAltVi: dish.copy.vi.imageAlt,
  };
}

function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Could not load image file."));
      image.onload = () => {
        const maxEdge = 1400;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not process image file."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

        if (dataUrl.length > 1_400_000) {
          reject(
            new Error(
              "Image is too large after compression. Use a smaller image or paste an image URL.",
            ),
          );
          return;
        }

        resolve(dataUrl);
      };

      image.src = String(reader.result ?? "");
    };

    reader.readAsDataURL(file);
  });
}

export function MenuSettingsForm({ initialDishes }: MenuSettingsFormProps) {
  const router = useRouter();
  const [dishes, setDishes] = useState<TemporaryDishForm[]>(
    initialDishes.map(toFormDish),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateDish<K extends keyof TemporaryDishForm>(
    index: number,
    key: K,
    value: TemporaryDishForm[K],
  ) {
    setDishes((current) =>
      current.map((dish, dishIndex) =>
        dishIndex === index ? { ...dish, [key]: value } : dish,
      ),
    );
  }

  async function uploadImage(index: number, file: File | undefined) {
    if (!file) {
      return;
    }

    setMessage(null);
    setError(null);

    try {
      const imageUrl = await resizeImageFile(file);
      updateDish(index, "imageUrl", imageUrl);
      setMessage("Image added to the temporary dish.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Could not add image.",
      );
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/menu-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temporaryDishes: dishes }),
      });
      const data = (await response.json()) as {
        temporaryDishes?: TemporaryMenuDish[];
        error?: string;
      };

      if (!response.ok || !data.temporaryDishes) {
        setError(data.error ?? "Could not save menu.");
        return;
      }

      setDishes(data.temporaryDishes.map(toFormDish));
      setMessage("Temporary dishes saved.");
      router.refresh();
    } catch {
      setError("Could not save menu.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch("/api/menu-settings/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="menu-settings-shell">
      <div className="menu-settings-heading">
        <div>
          <p className="menu-kicker">Rau Om</p>
          <h1>Menu Settings</h1>
        </div>
        <button type="button" className="menu-settings-ghost" onClick={signOut}>
          Sign out
        </button>
      </div>

      <form className="menu-settings-form" onSubmit={save}>
        {dishes.map((dish, index) => (
          <fieldset className="menu-settings-card" key={dish.slot}>
            <legend>Temporary Dish {dish.slot}</legend>

            <label className="menu-settings-checkbox">
              <input
                type="checkbox"
                checked={dish.isActive}
                onChange={(event) =>
                  updateDish(index, "isActive", event.target.checked)
                }
              />
              Show this dish on the menu
            </label>

            <div className="menu-settings-grid">
              <label>
                English name
                <input
                  value={dish.nameEn}
                  onChange={(event) =>
                    updateDish(index, "nameEn", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                Vietnamese name
                <input
                  value={dish.nameVi}
                  onChange={(event) =>
                    updateDish(index, "nameVi", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                English price
                <input
                  value={dish.priceEn}
                  onChange={(event) =>
                    updateDish(index, "priceEn", event.target.value)
                  }
                  placeholder="$15/bowl"
                  required
                />
              </label>
              <label>
                Vietnamese price
                <input
                  value={dish.priceVi}
                  onChange={(event) =>
                    updateDish(index, "priceVi", event.target.value)
                  }
                  placeholder="$15/tô"
                  required
                />
              </label>
              <label>
                Delivery date
                <input
                  type="date"
                  value={dish.deliveryDate}
                  onChange={(event) =>
                    updateDish(index, "deliveryDate", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                Last day to order
                <input
                  type="date"
                  value={dish.orderDeadline}
                  onChange={(event) =>
                    updateDish(index, "orderDeadline", event.target.value)
                  }
                  required
                />
              </label>
            </div>

            <label>
              English description
              <textarea
                value={dish.descriptionEn}
                onChange={(event) =>
                  updateDish(index, "descriptionEn", event.target.value)
                }
                rows={3}
                required
              />
            </label>
            <label>
              Vietnamese description
              <textarea
                value={dish.descriptionVi}
                onChange={(event) =>
                  updateDish(index, "descriptionVi", event.target.value)
                }
                rows={3}
                required
              />
            </label>

            <div className="menu-settings-image-row">
              <div className="menu-settings-image-preview">
                {dish.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dish.imageUrl} alt={dish.imageAltEn} />
                ) : (
                  <span>No image selected</span>
                )}
              </div>
              <div className="menu-settings-image-controls">
                <label>
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void uploadImage(index, event.target.files?.[0])
                    }
                  />
                </label>
                <label>
                  Image URL or site path
                  <input
                    value={dish.imageUrl.startsWith("data:image/")
                      ? "Uploaded image"
                      : dish.imageUrl}
                    onChange={(event) =>
                      updateDish(index, "imageUrl", event.target.value)
                    }
                    onFocus={(event) => {
                      if (dish.imageUrl.startsWith("data:image/")) {
                        event.currentTarget.select();
                      }
                    }}
                  />
                </label>
                <div className="menu-settings-grid">
                  <label>
                    English image alt
                    <input
                      value={dish.imageAltEn}
                      onChange={(event) =>
                        updateDish(index, "imageAltEn", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    Vietnamese image alt
                    <input
                      value={dish.imageAltVi}
                      onChange={(event) =>
                        updateDish(index, "imageAltVi", event.target.value)
                      }
                      required
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="menu-settings-ghost"
                  onClick={() => updateDish(index, "imageUrl", "")}
                >
                  Clear image
                </button>
              </div>
            </div>
          </fieldset>
        ))}

        <div className="menu-settings-actions">
          <button type="submit" className="menu-order-button" disabled={saving}>
            {saving ? "Saving..." : "Save temporary dishes"}
          </button>
          {message ? <p className="menu-settings-message">{message}</p> : null}
          {error ? <p className="menu-settings-error">{error}</p> : null}
        </div>
      </form>
    </section>
  );
}
