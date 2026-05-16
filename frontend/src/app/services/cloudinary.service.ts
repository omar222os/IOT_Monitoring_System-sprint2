import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

const CLOUD_NAME = 'djp9aydnb';
const UPLOAD_PRESET = 'test_preset';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  constructor(private http: HttpClient) {}

  upload(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    return this.http
      .post<{ secure_url: string }>(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData
      )
      .pipe(map(res => res.secure_url));
  }
}
