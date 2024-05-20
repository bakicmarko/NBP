import psycopg2
import csv
import datetime

conn = psycopg2.connect("CON PARAMS")
cursor = conn.cursor()

cursor.execute('''CREATE TABLE fakenews
               (id SERIAL PRIMARY KEY,
               uuid varchar(350),
               author varchar(50),
               title varchar(200),
               titleTSV TSVECTOR,
               text varchar(100000),
               textTSV TSVECTOR,
               language varchar(100),
               siteurl varchar(150),
               country nchar(2),
               thread_title varchar(820),
               thread_titleTSV TSVECTOR,
               main_img_url varchar(210),
               replies_count int,
               participants int,
               likes int,
               comments int,
               shares int,
               type varchar(15)
               )
               ''')

cursor.execute('''CREATE TRIGGER fakenews_InsUpd_Trigg
            BEFORE INSERT OR UPDATE ON fakenews
            FOR EACH ROW
            EXECUTE PROCEDURE tsvector_update_trigger(textTSV, 'pg_catalog.english', text)
               ''')

cursor.execute('''CREATE TRIGGER fakenews_InsUpd_Trigg2
            BEFORE INSERT OR UPDATE ON fakenews
            FOR EACH ROW
            EXECUTE PROCEDURE tsvector_update_trigger(titleTSV, 'pg_catalog.english', title)
               ''')

cursor.execute('''CREATE TRIGGER fakenews_InsUpd_Trigg3
            BEFORE INSERT OR UPDATE ON fakenews
            FOR EACH ROW
            EXECUTE PROCEDURE tsvector_update_trigger(thread_titleTSV, 'pg_catalog.english', thread_title)
               ''')


with open('fake.csv', encoding="utf-8") as csv_file:
    csv_reader = csv.reader(csv_file, delimiter=',')
    line_count = 0
    sql_string = "INSERT INTO fakenews VALUES (DEFAULT,  %s, %s, %s, NULL ,%s, NULL ,%s, %s, %s, %s,NULL, %s, %s, %s, %s, %s, %s, %s)"
    try:
        for row in csv_reader:
            if line_count != 0:
                try:
                    int(row[14])
                except:
                    row[14] = 1
                try:
                    int(row[15])
                except:
                    row[15] = 1
                try:
                    int(row[16])
                except:
                    row[16] = 1
                try:
                    int(row[17])
                except:
                    row[17] = 1
                try:
                    int(row[18])
                except:
                    row[18] = 1

                if len(row[6]) > 30:
                    row[6] = 'english'
                if len(row[9]) > 2:
                    row[9] = 'US'
                if len(row[2]) > 50:
                    row[2] = 'John Do'
                if len(row[4]) > 200:
                    row[4] = 'title'
                if len(row[0]) > 350:
                    row[0] = 'NaN'
                if len(row[19]) > 15:
                    row[19] = 'bias'
                if len(row[8]) > 150:
                    row[8] = 'https://rnd.com'
                if len(row[13]) > 150:
                    row[13] = 'https://rnd.com'

                cursor.execute(sql_string, (row[0], row[2],  row[4], row[5], row[6],
                                            row[8], row[9], row[11], row[13], int(row[14]), int(row[15]), int(row[16]), int(row[17]), int(row[18]), row[19]))

            line_count += 1
    except:
        line_count += 1

    print(f'Processed {line_count} lines.')


print('!!!DONE!!!')
conn.commit()
